const FLAG = "__operoBlankPatched";
const NATIVE_OPEN = "__operoNativeOpen";

export function preventNewTabs(): void {
  const win = window as any;

  if (win[FLAG]) return;
  win[FLAG] = true;

  if (!win[NATIVE_OPEN]) {
    win[NATIVE_OPEN] = window.open.bind(window);
  }
  const nativeOpen = win[NATIVE_OPEN] as typeof window.open;

  window.open = (url?, target?, features?) => {
    const safeTarget = target && target !== "_blank" ? target : "_self";
    return nativeOpen.call(window, url, safeTarget, features);
  };

  function removeTargetBlank(root: Document | Element) {
    root
      .querySelectorAll?.('[target="_blank"]')
      .forEach((el) => el.removeAttribute("target"));
  }

  removeTargetBlank(document);

  new MutationObserver((mutations) => {
    for (const { addedNodes } of mutations) {
      addedNodes.forEach((node) => {
        if (node instanceof Element) removeTargetBlank(node);
      });
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
