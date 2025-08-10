export async function click(element: Element): Promise<void> {
  if (!(element instanceof HTMLElement)) return;

  const tag = element.tagName.toLowerCase();
  const nativelyClickable =
    ["button", "a", "input", "textarea", "select", "option", "label"].includes(tag) ||
    element.getAttribute("role") === "button" ||
    element.getAttribute("role") === "link";

  try {
    if (nativelyClickable) {
      element.click();
    } else {
      customClick(element as HTMLElement);
    }
  } catch (e) {
    console.error("Error clicking element:", e);
  }
}

export async function input(element: Element, text: string): Promise<void> {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (
    element instanceof HTMLElement &&
    (element.isContentEditable || element.getAttribute("role") === "textbox")
  ) {
    element.focus();
    document.execCommand("insertText", false, text);
  }
}

export async function keyPress(element: Element, key: string): Promise<void> {
  if (element instanceof HTMLElement) {
    element.focus();
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    if (key === "Enter") {
      const form = element.closest("form");
      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      }
    }
  }
}

export async function scroll(direction: "up" | "down"): Promise<void> {
  const scrollAmount = window.innerHeight;
  if (direction === "up") {
    window.scrollBy(0, -scrollAmount);
  } else if (direction === "down") {
    window.scrollBy(0, scrollAmount);
  }
}

export async function navigate(url: string): Promise<void> {
  try {
    window.location.href = url;
  } catch (e) {
    console.error("Error navigating to URL:", e);
  }
}

export async function uploadFile(element: Element, fileData: string, fileName: string): Promise<void> {
  try {
    let fileInput: HTMLInputElement | null = null;

    if (element instanceof HTMLInputElement && element.type === "file") {
      fileInput = element;
    } else if (element instanceof HTMLElement) {
      element.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const allFileInputs = document.querySelectorAll('input[type="file"]');
      for (const input of allFileInputs) {
        const htmlInput = input as HTMLInputElement;
        const style = window.getComputedStyle(htmlInput);
        const rect = htmlInput.getBoundingClientRect();

        if ((style.display !== 'none' && style.visibility !== 'hidden') ||
          (rect.width > 0 && rect.height > 0) ||
          htmlInput === document.activeElement) {
          fileInput = htmlInput;
          break;
        }
      }

      if (!fileInput) {
        const form = element.closest('form');
        if (form) {
          fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
        }
      }

      if (!fileInput) {
        fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      }
    }

    if (!fileInput) {
      console.error("No file input element found");
      return;
    }

    const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid file data format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const file = new File([blob], fileName, { type: mimeType });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    fileInput.files = dataTransfer.files;

    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    fileInput.dispatchEvent(new Event("input", { bubbles: true }));
  } catch (e) {
    console.error("Error uploading file:", e);
  }
}

export function getElementByXPath(xpath: string): Element | null {
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  );
  return result.singleNodeValue as Element;
}

function customClick(outer: HTMLElement): void {
  function findFirstClickable(root: HTMLElement): HTMLElement | null {
    const descendants = root.querySelectorAll<HTMLElement>(":scope *");
    for (const el of descendants) {
      const style = window.getComputedStyle(el);
      const hasSize = el.clientWidth > 0 && el.clientHeight > 0;
      const pointerEnabled = style.pointerEvents !== "none";
      const visible = style.visibility !== "hidden" && style.display !== "none";

      if (pointerEnabled && visible && hasSize) {
        return el;
      }
    }
    return null;
  }

  function dispatchMouseSequence(target: HTMLElement) {
    ["mousedown", "mouseup", "click"].forEach((type) =>
      target.dispatchEvent(
        new MouseEvent(type, {
          view: window,
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
  }

  const INNER_TARGET_SELECTORS = [
    ':scope [role="button"]',
    ":scope button",
    ":scope a[href]",
    ':scope input[type="button"]',
    ':scope input[type="submit"]',
    ":scope [tabindex]",
    ":scope [onclick]",
    ':scope [class*="preview"]',
    ':scope [class*="card"]',
    ':scope [class*="item"]',
    ':scope [class*="image"]',
    ':scope [class*="product"]',
    ":scope [data-image-index]",
    ":scope img",
    ':scope [class*="a-button"]',
    ':scope [name*="addToCart"]',
    ':scope [aria-label*="Add to cart"]',
  ].join(", ");
  const ariaDisabled = outer.getAttribute("aria-disabled");

  if (!outer) return;

  if (ariaDisabled === "true") {
    outer.setAttribute("aria-disabled", "false");
  }

  outer.setAttribute("aria-disabled", "false");
  (outer.style as CSSStyleDeclaration).pointerEvents = "auto";
  dispatchMouseSequence(outer);

  let inner = outer.querySelector(INNER_TARGET_SELECTORS) as HTMLElement | null;
  inner = inner ?? findFirstClickable(outer);

  if (inner) {
    dispatchMouseSequence(inner);
  }
}
