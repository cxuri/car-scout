const MarketplaceSelectors = {
  olx: {
    listing: `li[data-aut-id="itemBox"], li[data-aut-id="itemBox2"]`,
    title: `div[data-aut-id="itemTitle"]`,
    price: `span[data-aut-id="itemPrice"]`,
    location: `div[data-aut-id="itemDetails"]`,
    subtitle: `div[data-aut-id="itemSubTitle"]`,
    link: `a[href*="/item/"]`,
  },
};

// Listen for raw HTML sent from the background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SCOUT_LISTINGS_HTML") {
    const { html, error } = msg;

    if (error) {
      console.error("Error from background:", error);
      return;
    }

    if (!html) return;

    // Parse HTML using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Extract listings
    const listings = [
      ...doc.querySelectorAll(MarketplaceSelectors.olx.listing),
    ].map((el) => {
      const titleEl = el.querySelector(MarketplaceSelectors.olx.title);
      const priceEl = el.querySelector(MarketplaceSelectors.olx.price);
      const locationEl = el.querySelector(MarketplaceSelectors.olx.location);
      const subtitleEl = el.querySelector(MarketplaceSelectors.olx.subtitle);
      const linkEl = el.querySelector(MarketplaceSelectors.olx.link);

      // Parse location and date from the location element
      let location = "";
      let date = "";

      if (locationEl) {
        // The location text is directly in the div (not in a span)
        // The date is in a span inside the div
        const locationText = locationEl.textContent;
        const dateSpan = locationEl.querySelector("span");

        // Extract location by removing the date span content
        if (dateSpan) {
          location = locationText.replace(dateSpan.textContent, "").trim();
          date = dateSpan.textContent.trim();
        } else {
          // If no span found, use the entire text as location
          location = locationText.trim();
        }
      }

      const subtitleText =
        subtitleEl?.getAttribute("title") ||
        subtitleEl?.textContent?.trim() ||
        "";
      let year = "";
      let mileage = "";

      if (subtitleText) {
        const parts = subtitleText.split(" - ");
        if (parts.length >= 2) {
          year = parts[0].trim();
          mileage = parts[1].trim();
        } else if (parts.length === 1) {
          year = parts[0].trim();
        }
      }

      return {
        title: titleEl?.textContent?.trim() || "",
        price: priceEl?.textContent?.trim() || "",
        location: location,
        date: date,
        year: year,
        mileage: mileage,
        url: linkEl?.getAttribute("href")
          ? `https://www.olx.in${linkEl.getAttribute("href")}`
          : "",
      };
    });

    console.log("SCOUT: Extracted listings", listings);

    window.postMessage({ type: "SCOUT_LISTINGS", data: listings }, "*");
  }
});

// Listen for webpage messages and forward to background
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "START_SCOUT") {
    chrome.runtime.sendMessage({
      type: "START_SCOUT",
      query: event.data.query, // The search query
      location: event.data.location, // The location filter (e.g., "kerala", "chennai")
    });
  }
});
