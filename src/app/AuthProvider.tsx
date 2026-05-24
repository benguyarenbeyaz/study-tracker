"use client";

import React, { useEffect, useState } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);

  useEffect(() => {
    const initializeMsal = async () => {
      const pca = new PublicClientApplication(msalConfig);
      await pca.initialize(); // This is the crucial missing step for MSAL v3!
      setMsalInstance(pca);
    };
    initializeMsal();
  }, []);

  // Wait until Microsoft is fully initialized before rendering the app
  if (!msalInstance) return <div className="p-4 text-slate-400">Loading Calendar Services...</div>;

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
}