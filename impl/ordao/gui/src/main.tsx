import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, Container } from '@chakra-ui/react'
import './index.css'
import BreakoutSubmitApp from './BreakoutSubmitApp'
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import Fallback from './components/Fallback'
import { PrivyProvider } from '@privy-io/react-auth'
import { config } from './global/config'

console.debug = console.log;
console.debug("debug test")
console.log("log test")

// window.onerror = function myErrorHandler(errorMsg) {
//     alert("Error occured: " + errorMsg);
//     return false;
// }

// const logError = (error: Error, info: ErrorInfo) => {
//   console.error(stringify(error));
//   console.error("Error info", stringify(info));
// };

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<BreakoutSubmitApp />} errorElement={<Fallback />}/>
  )
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
      <ChakraProvider>
        <Container minHeight="100vh" minWidth="100vw" padding="0px">
          <RouterProvider router={router} />
        </Container>
      </ChakraProvider>
    </PrivyProvider>
  </React.StrictMode>,
)
