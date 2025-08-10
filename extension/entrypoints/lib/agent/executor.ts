// @ts-nocheck
import { buildDomTree, cleanupHighlights } from "./dom-tree";
import type {
  PageDom,
  ElementNode,
  ActionType,
  AgentStepResult,
  HistoryStep,
} from "@/types";
import { preventNewTabs } from "../browser/blank-patch";
import { getElementByXPath, click, input, keyPress, scroll, navigate, uploadFile } from "./actions";
import { agentState } from "./state";
import { fetchAgentAction } from "./api";
import { parseHistorySteps, formatHistorySteps } from "./history";

function findElementByHighlightIndex(
  domTree: PageDom,
  highlightIndex: number,
): Element | null {
  const elementId = Object.keys(domTree.map).find((id) => {
    const node = domTree.map[id];
    return (
      node.type !== "TEXT_NODE" &&
      (node as ElementNode).highlightIndex === highlightIndex
    );
  });

  if (elementId) {
    const elementNode = domTree.map[elementId] as ElementNode;
    return getElementByXPath(elementNode.xpath);
  }
  return null;
}

async function executeAction(
  element: Element | null,
  action: ActionType,
  value: string | null,
): Promise<void> {
  if (action === "click" && element) {
    await click(element);
  } else if (action === "input" && value && element) {
    await input(element, value);
  } else if (action === "key_press" && value && element) {
    await keyPress(element, value);
  } else if (action === "scroll" && value) {
    await scroll(value as "up" | "down");
  } else if (action === "navigate" && value) {
    await navigate(value);
  } else if (action === "upload" && element) {
    const state = await agentState.getValue();
    const jobData = state.jobApplicationData;
    if (jobData?.resumeFile && jobData?.resumeFileName) {
      await uploadFile(element, jobData.resumeFile, jobData.resumeFileName);
    }
  }
}

export async function runAgentStep(): Promise<AgentStepResult> {
  try {
    preventNewTabs();

    const domTree: PageDom = buildDomTree({
      doHighlightElements: true,
      focusHighlightIndex: -1,
      viewportExpansion: 0,
      debugMode: false,
    });

    const screenshot = await browser.runtime.sendMessage({
      type: "takeScreenshot",
    });

    const state = await agentState.getValue();
    const { userInfo } = await browser.storage.local.get("userInfo");
    const email = userInfo?.email;
    
    if (!email) {
      throw new Error("User not authenticated");
    }
    
    const result = await fetchAgentAction(
      domTree,
      state.prompt,
      state.history,
      screenshot,
      state.agentMode,
      state.jobApplicationData,
      email,
    );

    if (result.action === "finish") {
      return { history: result.history, isRunning: false };
    }

    const element = findElementByHighlightIndex(domTree, result.highlightIndex);

    if (element || result.action === "scroll" || result.action === "navigate") {
      await executeAction(element, result.action, result.value);
      return { history: result.history, isRunning: true };
    } else if (result.action === "upload" && element) {
      await executeAction(element, result.action, result.value);
      return { history: result.history, isRunning: true };
    } else {
      console.error(
        `Element with highlightIndex ${result.highlightIndex} not found for action ${result.action}`,
      );
      const steps = parseHistorySteps(result.history);
      const errorStep: HistoryStep = {
        step_number: steps.length + 1,
        action: "finish",
        value: `Failed to find element with highlightIndex ${result.highlightIndex}`,
        summary: `Error: Element not found for ${result.action} action`,
      };
      steps.push(errorStep);
      return { history: formatHistorySteps(steps), isRunning: false };
    }
  } finally {
    cleanupHighlights();
  }
}
