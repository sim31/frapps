import { 
  Stack,
  Input,
  FormControl,
  FormLabel,
  Button,
} from "@chakra-ui/react";

export default function RespectBreakoutForm() {
  return (
    <Stack direction="column" spacing="1em" width="40em">
      {/* <InputGroup>
        <InputLeftAddon>Meeting:</InputLeftAddon>
        <Input value={1}></Input>
      </InputGroup>

      <InputGroup>
        <InputLeftAddon>Group:</InputLeftAddon>
        <Input value={1}></Input>
      </InputGroup>

      <InputGroup>
        <InputLeftAddon>Level 6:</InputLeftAddon>
        <Input placeholder="Level 6 account"></Input>
      </InputGroup>

      <InputGroup>
        <InputLeftAddon>Level 5:</InputLeftAddon>
        <Input placeholder="Level 5 account"></Input>
      </InputGroup>

      <InputGroup>
        <InputLeftAddon>Level 4:</InputLeftAddon>
        <Input placeholder="Level 4 account"></Input>
      </InputGroup>
      
      <InputGroup>
        <InputLeftAddon>Level 3:</InputLeftAddon>
        <Input placeholder="Level 3 account"></Input>
      </InputGroup>

      <InputGroup>
        <InputLeftAddon>Level 2:</InputLeftAddon>
        <Input placeholder="Level 2 account"></Input>
      </InputGroup>

      <InputGroup>
        <InputLeftAddon>Level 1:</InputLeftAddon>
        <Input placeholder="Level 1 account"></Input>
      </InputGroup> */}

      <FormControl>
        <FormLabel>Meeting</FormLabel>
        <Input value={1}></Input>
      </FormControl>

      <FormControl>
        <FormLabel>Group</FormLabel>
        <Input value={1}></Input>
      </FormControl>

      <FormControl>
        <FormLabel>Level 6</FormLabel>
        <Input placeholder="Level 6 account"></Input>
      </FormControl>

      <FormControl>
        <FormLabel>Level 5</FormLabel>
        <Input placeholder="Level 5 account"></Input>
      </FormControl>

      <FormControl>
        <FormLabel>Level 4</FormLabel>
        <Input placeholder="Level 4 account"></Input>
      </FormControl>
      
      <FormControl>
        <FormLabel>Level 3</FormLabel>
        <Input placeholder="Level 3 account"></Input>
      </FormControl>

      <FormControl>
        <FormLabel>Level 2</FormLabel>
        <Input placeholder="Level 2 account"></Input>
      </FormControl>

      <FormControl>
        <FormLabel>Level 1</FormLabel>
        <Input placeholder="Level 1 account"></Input>
      </FormControl>

      <Button>Submit</Button>
      <Button>Share</Button>


    </Stack>
  )
}