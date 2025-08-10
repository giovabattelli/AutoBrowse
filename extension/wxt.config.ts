import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: [
      "sidePanel",
      "storage",
      "webRequest",
      "tabs",
      "identity"
    ],
    host_permissions: ["<all_urls>"],
    background: {
      service_worker: "background.ts",
      type: "module"
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
});
