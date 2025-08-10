import React from "react";

import { Button } from "../../components/ui/button";
import type { LoginPageProps } from "../../types";

const LoginPage: React.FC<LoginPageProps> = ({ onSignIn }) => {
  return (
    <div className="relative flex items-center justify-center h-screen bg-background overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-black to-transparent opacity-50" />
      <div className="flex flex-col items-center gap-8 relative z-10">
        <div className="w-24 h-24">
          <img
            src="/opero-labs-logo.png"
            alt="Opero Labs Logo"
            className="w-full h-full object-contain"
            style={{ 
              filter: "drop-shadow(0 0 0 white) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white) drop-shadow(0 0 2px white) drop-shadow(0 0 4px white) drop-shadow(0 0 6px white)"
            }}
          />
        </div>
        <Button onClick={onSignIn} className="text-base px-6 py-3">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
