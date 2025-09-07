// Background script handler
chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type === "START_SCOUT" && sender.tab?.id) {
    const { query, loc = "kothamangalam" } = msg; // Default to "cars" if no location specified
    console.log("Fetching query:", query, "Location:", location);

    try {
      // Construct the URL with location filtering only
      const url = `https://www.olx.in/${loc}/q-${encodeURIComponent(query)}`;
      console.log("Fetching URL:", url);

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const htmlText = await res.text();
      console.log("Received HTML, length:", htmlText.length);

      // Send raw HTML to content script
      chrome.tabs.sendMessage(sender.tab.id, {
        type: "SCOUT_LISTINGS_HTML",
        html: htmlText,
      });
    } catch (err) {
      console.error("Error fetching OLX page:", err);
      chrome.tabs.sendMessage(sender.tab.id, {
        type: "SCOUT_LISTINGS_HTML",
        html: "",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
});
