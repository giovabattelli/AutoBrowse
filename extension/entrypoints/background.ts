import { agentState } from "@/entrypoints/lib/agent/state";
import { waitForPage } from "./lib/browser/wait-for-page.js";
import { API_BASE } from "@/lib/config";

export default defineBackground(() => {
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);

  async function signIn() {
    const { url } = await fetch(
      `${API_BASE}/login/google?ext=${browser.runtime.id}`,
    ).then((r) => r.json());

    const redirect = await browser.identity.launchWebAuthFlow({
      url,
      interactive: true,
    });
    if (!redirect) throw new Error("User cancelled Google sign-in");

    const code = new URL(redirect).searchParams.get("code");
    if (!code) throw new Error("Google OAuth returned no code");

    const userInfo = await fetch(
      `${API_BASE}/auth/google?code=${code}&ext=${browser.runtime.id}`,
    ).then((r) => r.json());

    await browser.storage.local.set({ userInfo });
    browser.runtime.sendMessage({ type: "authStateChanged", userInfo });
  }

  async function sendMessageWithRetries(
    tabId: number,
    message: any,
    retries = 5,
    delay = 1500,
  ) {
    for (let i = 0; i < retries; i++) {
      try {
        await browser.tabs.sendMessage(tabId, message);
        return { success: true };
      } catch (e) {
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          return { success: false, error: e };
        }
      }
    }
    return { success: false, error: new Error("Unknown error") };
  }

  const runAgent = async () => {
    const state = await agentState.getValue();
    if (!state.isRunning) return;

    const result = await sendMessageWithRetries(state.tabId, {
      type: "runAgentStep",
    });

    if (!result.success) {
      console.error(`Failed to send message to tab ${state.tabId}`, result.error);
      await agentState.setValue({ ...state, isRunning: false });
    }
  };

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        switch (message.type) {
          case "getTabId":
            sendResponse(sender.tab);
            return;

          case "runAgent":
            await runAgent();
            sendResponse({ success: true });
            return;

          case "agentStepCompleted": {
            const { result } = message;
            if (sender.tab?.id != null) {
              if (result) {
                const state = await agentState.getValue();
                await agentState.setValue({
                  ...state,
                  isRunning: result.isRunning,
                  history: result.history,
                });
              }

              await waitForPage(sender.tab.id);
              await runAgent();
            }
            sendResponse({ success: true });
            return;
          }

          case "takeScreenshot": {
            const tab = sender.tab;
            if (tab?.id && tab.windowId) {
              try {
                const screenshot = await browser.tabs.captureVisibleTab(tab.windowId, {
                  format: "jpeg",
                  quality: 95,
                });
                sendResponse(screenshot);
                return;
              } catch (error) {
                console.error("Failed to capture screenshot:", error);
                sendResponse(null);
                return;
              }
            } else {
              sendResponse(null);
              return;
            }
          }


          case "getAuthState": {
            const { userInfo } = await browser.storage.local.get("userInfo");
            sendResponse(userInfo);
            return;
          }

          case "startAuth": {
            try {
              await signIn();
              sendResponse(true);
            } catch (e: any) {
              sendResponse({ error: e?.message ?? "Unknown error" });
            }
            return;
          }
          default:
            sendResponse(null);
            return;
        }
      } catch (error) {
        console.error("Error in message handler:", error);
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
      }
    })();

    return true;
  });
});
