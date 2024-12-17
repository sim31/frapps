import { Button, Center, Spinner, } from "@chakra-ui/react";
import RespectBreakoutForm from "./components/RespectBreakoutForm";
import { useCallback, useEffect, useMemo, useState } from "react";
import { config } from "./global/config.js";
import { useOrclient } from "@ordao/privy-react-orclient";
import { deploymentInfo } from "./global/config";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import AppBar from "./components/AppBar.js";

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

  const {
    login: privyLogin,
    logout: privyLogout,
    ready: privyReady,
    user,
    authenticated
  } = usePrivy();
  const conWallets = useWallets();
  // TODO: should figure out how to deal with multiple wallets.
  // User should be able to select one of them.
  const userWallet = useMemo(() =>{
    if (privyReady && authenticated && conWallets && conWallets.ready) {
      return conWallets.wallets.find(w => w.address === user?.wallet?.address);
    }
  }, [user, conWallets, privyReady, authenticated]);
  
  const orclient = useOrclient(deploymentInfo, userWallet);

  // Not adding privy's login to dependency list because it causes an infinite loop
  useEffect(() => {
    console.log("login effect. authenticated: ", authenticated);
    if (privyReady && !authenticated) {
      console.log("logging in");
      privyLogin();
    }
  }, [authenticated, userWallet, privyReady]);

  const login = useCallback(async () => {
    if (privyReady && authenticated) {
      await privyLogout();
    }
    privyLogin();
  }, [privyLogout, authenticated, privyReady])

  return (
    <>
      <AppBar
        title={config.appTitle}
        loggedInUser={userWallet?.address}
        onLogout={privyLogout}
        onLogin={privyLogin}
      />
      <Center minHeight="100vh">
        { !privyReady
          ? <Spinner size="xl"/>
          : (orclient && authenticated && userWallet
              ? <RespectBreakoutForm orclient={orclient}/>
              : <Button onClick={login}>Login</Button>
          )
        }
      </Center>
    </>
  )
}