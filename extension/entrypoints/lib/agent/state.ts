import { storage } from "wxt/utils/storage";

export const agentState = storage.defineItem<any>("local:agentState", {
  defaultValue: {
    isRunning: false,
    prompt: null,
    history: null,
    tabId: null,
    isEnriched: false,
    originalPrompt: null,
    jobApplicationData: null,
  },
});
