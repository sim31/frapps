import { 
  Stack,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
} from "@chakra-ui/react";

export default function BurnRespectForm() {
  return (
    <Stack direction="column" marginTop="2em" marginBottom="2em" spacing="1em">
      <Stack direction="row" spacing="1em">
        <Text alignContent="center">Amount: </Text>
        <NumberInput>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </Stack>

      <Stack direction="row" spacing="1em">
        <Text alignContent="center">From: </Text>
        <Input placeholder="Account"></Input>
      </Stack>

    </Stack>
  )
}