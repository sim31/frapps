import {  Center, } from "@chakra-ui/react";
import RespectBreakoutForm from "./components/RespectBreakoutForm";
import { useCallback, useEffect, useState } from "react";

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
    <Center minHeight="100vh">
      <RespectBreakoutForm />
    </Center>
  )
}