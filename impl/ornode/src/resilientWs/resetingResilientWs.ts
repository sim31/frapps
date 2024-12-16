import { Networkish, WebSocketProvider } from "ethers";
import { ResilientWs } from "./resilientWs.js";
import { sleep } from "ts-utils";

const log = (message: string) => {
  console.log("ResettingResilientWs: ", message);
};

export const ResettingResilientWs = (
  url: string,
  resetIntervalSec: number,
  onConnectedCb?: (provider: WebSocketProvider) => void,
  network?: Networkish,
) => {
  let terminate = ResilientWs(url, onConnectedCb, network);
  let interval: ReturnType<typeof setInterval> | undefined;
  if (resetIntervalSec > 0) {
    interval = setInterval(() => {
      log("Resetting ws connection");
      terminate();
      sleep(100);
      terminate = ResilientWs(url, onConnectedCb, network);
    }, resetIntervalSec * 1000)
  }
  return () => {
    log("Terminate called");
    if (interval) {
      clearInterval(interval);
    }
    terminate();
  }
}