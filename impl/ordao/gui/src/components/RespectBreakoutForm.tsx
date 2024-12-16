import { 
  Stack,
  Input,
  FormControl,
  FormLabel,
  Button,
  Text,
  Link,
  VStack,
  Spinner
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RespectBreakoutRequest, zRespectBreakoutRequest } from "@ordao/ortypes/orclient.js";
import { useSearchParamsState, SearchParamsStateType } from 'react-use-search-params-state'
import { fromError } from 'zod-validation-error';
import { hashObject } from "../utils/objectHash";
import SubmitBreakoutResModal from "./SubmitBreakoutResModal";
import TxProgressModal from "./TxProgressModal";
import { decodeError } from "../utils/decodeTxError";
import { linkToTx } from "../utils/blockExplorerLink";
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { useOrclient } from "@ordao/privy-react-orclient";
import { deploymentInfo } from "../global/config";
import { usePrivy, useWallets } from "@privy-io/react-auth";

const resultDefaults: SearchParamsStateType = {
  groupnumber: { type: 'number', default: null },
  vote1: { type: 'string', default: "" },
  vote2: { type: 'string', default: "" },
  vote3: { type: 'string', default: "" },
  vote4: { type: 'string', default: "" },
  vote5: { type: 'string', default: "" },
  vote6: { type: 'string', default: "" },
}

export default function RespectBreakoutForm() {
  const [meeting, setMeeting] = useState<string>("");
  const [initialized, setInitialized] = useState<boolean>(false);
  const [results, setResults] = useSearchParamsState(resultDefaults);
  const [errorStr, setErrorStr] = useState<string | undefined>(undefined);
  const [submitOpen, setSubmitOpen] = useState<boolean>(false);
  const [consensusId, setConsensusId] = useState<string>("");
  const [request, setRequest] = useState<RespectBreakoutRequest>();
  const [txProgressOpen, setTxProgressOpen] = useState<boolean>(false);
  const [txProgressStr, setTxProgressStr] = useState("");
  const [txProgressStatus, setTxProgressStatus] = 
    useState<'submitting' | 'submitted' | 'error' | undefined>()
  const [txHash, setTxHash] = useState("");
  const { login, user, ready: privyReady, authenticated } = usePrivy();
  const conWallets = useWallets();

  // TODO: should figure out how to deal with multiple wallets.
  // User should be able to select one of them.
  const userWallet = useMemo(() =>{
    if (conWallets && conWallets.ready) {
      return conWallets.wallets.find(w => w.address === user?.wallet?.address);
    }
  }, [user, conWallets]);
  
  const orclient = useOrclient(deploymentInfo, userWallet);

  // Not adding privy's login to dependency list because it causes an infinite loop
  useEffect(() => {
    console.log("login effect. authenticated: ", authenticated);
    if (!authenticated) {
      console.log("logging in");
      login();
    }
  }, [authenticated]);

  useEffect(() => {
    console.log("meeting number effect. privyRead: ", privyReady, ", authenticated: ", authenticated);
    const f = async () => {
      if (orclient && authenticated && privyReady) {
        const meetingNum = await orclient.getNextMeetingNum();
        setMeeting(meetingNum.toString());
        setInitialized(true);
      }
    }
    f();
  }, [orclient, privyReady, authenticated])

  const closeSubmitModal = () => {
    setSubmitOpen(false);
  }

  const openSubmitModal = async (req: RespectBreakoutRequest) => {
    setRequest(req);
    setConsensusId(await hashObject(results));
    setSubmitOpen(true);
  }

  const closeTxProgressModal = () => {
    setTxProgressStr("");
    setTxProgressStatus(undefined);
    setTxProgressOpen(false);
  }

  const onResSubmit = useCallback(async () => {
    if (request === undefined) {
      throw new Error("Request undefined");
    }
    if (orclient === undefined || !initialized) {
      throw new Error("orclient not initialized");
    }
    closeSubmitModal();
    setTxProgressStatus('submitting');
    setTxProgressStr("");
    setTxProgressOpen(true);
    try {
      const res = await orclient.proposeBreakoutResult(request);
      // TODO: block explorer link
      setTxProgressStatus('submitted');
      setTxHash(res.txReceipt.hash);
    } catch (err) {
      setTxProgressStr("");
      const decoded = decodeError(err);
      if (decoded) {
        // TODO: more friendly error message, explaining if it is a revert or what
        setTxProgressStr(`Transaction failed. Error type: ${decoded.type}, reason: ${decoded.reason}`)
        setTxProgressStatus('error');
      } else {
        setTxProgressOpen(false);
        throw err;
      }
    }
  }, [request, orclient, initialized])

  const onSubmitClick = async () => {
    const rankings: Array<string> = [];
    for (let i = 1; i <= 6; i++) {
      const key = `vote${i}`;
      if (typeof results[key] === 'string' && results[key].length > 0) {
        rankings.push(results[key]);
      } else {
        break;
      }
    }
    const request: RespectBreakoutRequest = {
      meetingNum: (meeting as unknown) as number,
      groupNum: (results.groupnumber as unknown) as number,
      rankings
    }

    try {
      const parsed = zRespectBreakoutRequest.parse(request);
      setErrorStr(undefined);
      console.log("Parsed: ", parsed);
      await openSubmitModal(parsed);
    } catch (err) {
      const validationError = fromError(err);
      const errStr = validationError.toString();
      console.log("Error: ", validationError);
      setErrorStr(errStr);
    }
  }

  const explorerLink = useMemo(() => {
    if (typeof txHash === 'string' && txHash.length > 0) {
      return linkToTx(txHash);
    } else {
      return undefined;
    }
  }, [txHash]);

  const fieldsFilled = useMemo(() => {
    return meeting !== "" && results.groupnumber !== null
           && results.vote1 !== "" && results.vote2 !== ""
           && results.vote3 !== "";
  }, [meeting, results])

  console.log("fieldsFilled: ", fieldsFilled);

  return initialized ? (
    <>
      <Stack direction="column" spacing="1em" width="34em">

        <SubmitBreakoutResModal
          isOpen={submitOpen}
          onClose={closeSubmitModal}
          onSubmit={onResSubmit}
          consensusId={consensusId}
        />

        <TxProgressModal
          isOpen={txProgressOpen}
          operationStr="Voting"
          done={txProgressStatus === 'error' || txProgressStatus === 'submitted'}
          onClose={closeTxProgressModal}
        >
          {txProgressStatus === 'submitting' || txProgressStatus === 'error'
            ? <Text noOfLines={4}>{txProgressStr}</Text>
            : (
              <VStack>
                <Text >Vote Submitted!</Text>
                <Link color="teal.500" isExternal href={explorerLink}>
                  Transaction in Block Explorer
                  <ExternalLinkIcon marginLeft="2px"/>
                </Link>
              </VStack>
            )
          }
        </TxProgressModal>

        <FormControl>
          <FormLabel>Meeting number</FormLabel>
          <Input
            type="number"
            value={meeting}
            onChange={e => setMeeting(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Group number</FormLabel>
          <Input
            type="number"
            value={results.groupnumber ?? ""}
            onChange={e => setResults({ groupnumber: e.target.value })}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Level 6</FormLabel>
          <Input
            placeholder="Level 6 account"
            value={results.vote1 ?? ""}
            onChange={e => setResults({ vote1: e.target.value })}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Level 5</FormLabel>
          <Input
            placeholder="Level 5 account"
            value={results.vote2 ?? ""}
            onChange={e => setResults({ vote2: e.target.value })}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Level 4</FormLabel>
          <Input
            placeholder="Level 4 account"
            value={results.vote3 ?? ""}
            onChange={e => setResults({ vote3: e.target.value })}
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Level 3</FormLabel>
          <Input
            placeholder="Level 3 account"
            value={results.vote4 ?? ""}
            onChange={e => setResults({ vote4: e.target.value })}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Level 2</FormLabel>
          <Input
            placeholder="Level 2 account"
            value={results.vote5 ?? ""}
            onChange={e => setResults({ vote5: e.target.value })}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Level 1</FormLabel>
          <Input
            placeholder="Level 1 account"
            value={results.vote6 ?? ""}
            onChange={e => setResults({ vote6: e.target.value })}
          />
        </FormControl>

        <Text color="red">{errorStr ?? ""}</Text>

        <Button onClick={onSubmitClick} isDisabled={!fieldsFilled || !initialized}>Submit</Button>
        {/* <Button>Share</Button> */}


      </Stack>
    </>
  )
  : <Spinner size="xl"/>
}