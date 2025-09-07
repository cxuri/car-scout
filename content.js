// Listen for messages from the webpage (Next.js app → window.postMessage)
window.addEventListener("message", (event) => {
  if (event.source !== window) return; // only accept messages from same page

  if (event.data?.type === "START_SCOUT") {
    chrome.runtime.sendMessage({
      type: "START_SCOUT",
      query: event.data.query,
    });
  }
});

// Listen for results from background.js and forward to the webpage
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SCOUT_LISTINGS") {
    window.postMessage(msg, "*");
  }
});
