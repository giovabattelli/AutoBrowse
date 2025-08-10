import { defineContentScript } from "#imports";
import { browser } from "wxt/browser";
import { runAgentStep } from "@/entrypoints/lib/agent/executor";
import type { AgentStepResult } from "@/types";

export default defineContentScript({
  matches: ["<all_urls>"],

  main() {
    browser.runtime.onMessage.addListener(async (message) => {
      if (message.type === "runAgentStep") {
        let result: AgentStepResult | undefined;
        try {
          result = await runAgentStep();
        } catch (e: any) {
          console.error("Error running agent step:", e);
          if (e.message?.includes("limited to 3 agent runs")) {
            result = {
              history: `Error: ${e.message}\n\nPlease upgrade to premium for unlimited agent runs.`,
              isRunning: false,
            };
          }
        } finally {
          browser.runtime.sendMessage({
            type: "agentStepCompleted",
            result,
          });
        }
      }
    });
  },
});
