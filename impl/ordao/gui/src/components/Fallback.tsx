import {
  Alert,
  AlertIcon,
  AlertTitle,
  Text,
  VStack
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useRouteError } from "react-router-dom";
import { stringify } from "ts-utils";

export default function Fallback() {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  const error = useRouteError();
  const [name, message] = useMemo(() => {
    if (typeof error === 'object' && error !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return [(error as any).name, (error as any).message]
    }
    return [undefined, undefined];
  }, [error])

  console.log("In Fallback");

  return (
    <VStack>
      <Alert status='error' minWidth="100vw">
        <AlertIcon />
        <AlertTitle>{`Unhandled Error ${name ?? ""}`}</AlertTitle>
      </Alert>
      <Text whiteSpace="pre-wrap" backgroundColor="#eeeee4" maxWidth="80vw" margin="2em">
        {`Message: ${message}

          Full object: ${stringify(error)}
        `}
      </Text>
    </VStack>
    
  );
}