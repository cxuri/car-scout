// Fired when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("CarScout installed ✅");
});

// Service worker: listens for messages
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "START_SCOUT") {
    const query = msg.query;
    console.log("Received query:", query);

    // Default result
    let result = {
      data: "",
    };

    // Example: simple test response
    if (query === "ping") {
      result = { data: "pong" };
    }

    // Send results back to content script in same tab
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: "SCOUT_LISTINGS",
        ...result,
      });
    }
  }
});
