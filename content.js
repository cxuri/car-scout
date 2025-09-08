/***************************************************************
 * Marketplace Scout - Content Script
 *
 * Author: Dhanesh U Pai
 * GitHub: https://github.com/cxuri/car-scout
 *
 * Description:
 * This content script parses listings from second-hand marketplaces
 * like OLX, extracting structured information such as title, price,
 * location, year, mileage, and URL.
 *
 * It uses a modular MarketplaceParser class to support multiple
 * marketplaces with custom CSS selectors.
 *
 * This is only used to pull listings realtime, we are not storing
 * the data or reposting anything on our site, this is simply a tool
 * giving users extended search only.
 ***************************************************************/

class MarketplaceParser {
  constructor(name, selectors, baseUrl = "") {
    this.name = name;
    this.selectors = selectors;
    this.baseUrl = baseUrl;
  }

  parse(html) {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const listings = [...doc.querySelectorAll(this.selectors.listing)].map(
      (el) => {
        const titleEl = el.querySelector(this.selectors.title);
        const priceEl = el.querySelector(this.selectors.price);
        const locationEl = el.querySelector(this.selectors.location);
        const subtitleEl = el.querySelector(this.selectors.subtitle);
        const linkEl = el.querySelector(this.selectors.link);

        let location = "";
        let date = "";

        if (locationEl) {
          const locationText = locationEl.textContent;
          const dateSpan = locationEl.querySelector("span");
          if (dateSpan) {
            location = locationText.replace(dateSpan.textContent, "").trim();
            date = dateSpan.textContent.trim();
          } else {
            location = locationText.trim();
          }
        }

        let year = "";
        let mileage = "";
        const subtitleText =
          subtitleEl?.getAttribute("title") ||
          subtitleEl?.textContent?.trim() ||
          "";
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
          location,
          date,
          year,
          mileage,
          url: linkEl?.getAttribute("href")
            ? this.baseUrl + linkEl.getAttribute("href")
            : "",
          marketplace: this.name,
        };
      },
    );

    return listings;
  }
}

// Marketplace configurations
const MarketplaceSelectors = {
  olx: new MarketplaceParser(
    "OLX",
    {
      listing: `li[data-aut-id="itemBox"], li[data-aut-id="itemBox2"]`,
      title: `div[data-aut-id="itemTitle"]`,
      price: `span[data-aut-id="itemPrice"]`,
      location: `div[data-aut-id="itemDetails"]`,
      subtitle: `div[data-aut-id="itemSubTitle"]`,
      link: `a[href*="/item/"]`,
    },
    "https://www.olx.in",
  ),
  // Add more marketplaces here:
  // quikr: new MarketplaceParser("Quikr", {...}, "https://www.quikr.com")
};

// Listen for raw HTML sent from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SCOUT_LISTINGS_HTML") {
    const { html, error, site } = msg;

    if (error) {
      console.error(`Error from ${site}:`, error);
      return;
    }

    if (!html) return;

    const parser = MarketplaceSelectors[site.toLowerCase()];
    if (!parser) {
      console.warn(`No parser configured for site: ${site}`);
      return;
    }

    const listings = parser.parse(html);

    console.log(`SCOUT: Extracted listings from ${site}`, listings);

    window.postMessage({ type: "SCOUT_LISTINGS", data: listings }, "*");
  }
});

// Forward messages from webpage to background
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data?.type === "START_SCOUT") {
    chrome.runtime.sendMessage({
      type: "START_SCOUT",
      query: event.data.query,
      location: event.data.location,
    });
  }
});
