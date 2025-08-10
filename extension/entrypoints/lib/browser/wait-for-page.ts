export function waitForPage(tabId: number) {
  const pending = new Set<string>();
  let lastActivity = Date.now();
  const idleMs = 500;
  const maxWaitMs = 10000;

  const filter = { urls: ["<all_urls>"], tabId };

  const isRelevant = (d: { type: string; url: string }): boolean => {
    const relevant = ["document", "stylesheet", "image", "font", "script", "iframe"];
    if (!relevant.includes(d.type)) return false;

    const ignored = [
      "analytics",
      "tracking",
      "telemetry",
      "beacon",
      "metrics",
      "doubleclick",
      "adsystem",
      "adserver",
      "advertising",
      "facebook.com/plugins",
      "platform.twitter",
      "linkedin.com/embed",
      "livechat",
      "zendesk",
      "intercom",
      "crisp.chat",
      "hotjar",
      "push-notifications",
      "onesignal",
      "pushwoosh",
      "heartbeat",
      "ping",
      "alive",
      "webrtc",
      "rtmp://",
      "wss://",
      "cloudfront.net",
      "fastly.net",
    ];

    return !ignored.some((p) => d.url.toLowerCase().includes(p));
  };

  const detach = () => {
    browser.webRequest.onBeforeRequest.removeListener(onBefore);
    browser.webRequest.onCompleted.removeListener(onDone);
    browser.webRequest.onErrorOccurred.removeListener(onDone);
  };

  const onBefore = (details: any): undefined => {
    if (!isRelevant(details)) return undefined;
    pending.add(details.requestId);
    lastActivity = Date.now();
    return undefined;
  };

  const onDone = (details: any): void => {
    if (!pending.has(details.requestId)) return;
    pending.delete(details.requestId);
    lastActivity = Date.now();
  };

  browser.webRequest.onBeforeRequest.addListener(onBefore as any, filter as any);
  browser.webRequest.onCompleted.addListener(onDone as any, filter as any);
  browser.webRequest.onErrorOccurred.addListener(onDone as any, filter as any);

  return new Promise<void>((resolve) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();

      if (pending.size === 0 && now - lastActivity >= idleMs) {
        clearInterval(timer);
        detach();
        setTimeout(resolve, 1000);
      }

      if (now - start > maxWaitMs) {
        clearInterval(timer);
        detach();
        setTimeout(resolve, 1000);
      }
    }, 100);
  });
}
