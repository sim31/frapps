import {  Center, } from "@chakra-ui/react";
import RespectBreakoutForm from "./components/RespectBreakoutForm";
import { useCallback, useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { config } from "./global/config.js";

export default function BreakoutSubmitApp() {
  const [error, setError] = useState();

  if (error) {
    throw error;
  }

  const promiseRejectionHandler = useCallback((event: PromiseRejectionEvent) => {
    setError(event.reason);
  }, []);

  useEffect(() => {
    window.addEventListener("unhandledrejection", promiseRejectionHandler);

    return () => {
      window.removeEventListener("unhandledrejection", promiseRejectionHandler);
    };
    /* eslint-disable react-hooks/exhaustive-deps */
  }, []);

  return (
    <PrivyProvider
      appId={config.privyAppId || ""}
      config={{
        embeddedWallets: {
          // IMPORTANT: use this option if you don't want to deal with multiple wallets per user account
          // and you want to prefer external wallet if user has one.
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <Center minHeight="100vh">
        <RespectBreakoutForm />
      </Center>
    </PrivyProvider>
  )
}