import { useState, useEffect } from "react";

type Page = "login" | "app";

export const useAuth = () => {
  const [page, setPage] = useState<Page>("login");
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const user = await browser.runtime.sendMessage({ type: "getAuthState" });
      setUserInfo(user);
      setPage(user ? "app" : "login");
    };

    init();

    const onMsg = (msg: any) => {
      if (msg?.type === "authStateChanged") {
        setUserInfo(msg.userInfo);
        setPage(msg.userInfo ? "app" : "login");
      }
    };

    browser.runtime.onMessage.addListener(onMsg);
    return () => browser.runtime.onMessage.removeListener(onMsg);
  }, []);

  const handleSignIn = () => {
    browser.runtime.sendMessage({ type: "startAuth" });
  };

  return { page, userInfo, handleSignIn };
};
