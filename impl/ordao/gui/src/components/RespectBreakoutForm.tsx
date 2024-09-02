import { 
  Stack,
  Input,
  FormControl,
  FormLabel,
  Button,
  Text
} from "@chakra-ui/react";
import { useState } from "react";
import { RespectBreakoutRequest, zRespectBreakoutRequest } from "ortypes/orclient.js";
import { useSearchParamsState, SearchParamsStateType } from 'react-use-search-params-state'
import { fromError } from 'zod-validation-error';
import { orclient } from "../global/orclient";


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

  const [meeting, setMeeting] = useState("1");
  const [results, setResults] = useSearchParamsState(resultDefaults);
  const [errorStr, setErrorStr] = useState<string | undefined>(undefined);

  const onSubmit = async () => {
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
      orclient.then(cl => {
        cl.proposeBreakoutResult(parsed);
      });
    } catch (err) {
      const validationError = fromError(err);
      const errStr = validationError.toString();
      console.log("Error: ", validationError);
      setErrorStr(errStr);
    }
    
  }

  return (
    <>
      <Stack direction="column" spacing="1em" width="40em">

        <FormControl>
          <FormLabel>Meeting</FormLabel>
          <Input
            type="number"
            value={meeting}
            onChange={e => setMeeting(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Group</FormLabel>
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

        <Button onClick={onSubmit}>Submit</Button>
        {/* <Button>Share</Button> */}


      </Stack>
    </>
  )
}