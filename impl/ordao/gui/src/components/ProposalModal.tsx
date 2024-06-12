import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
  TableContainer,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup
} from '@chakra-ui/react'
import { Proposal } from '../global/types.js';

export type ProposalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal
}

export default function ProposalModal(props: ProposalModalProps) {
  return (
    <Modal size="5xl" isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="2xl">#{props.proposal.id} {props.proposal.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="xl" as="i">Mint 10 OPF to Tom</Text>
          <TableContainer marginTop="1em" marginBottom="1em">
            <Table size="md" variant='unstyled'>
              <Tbody>
                <Tr>
                  <Td color="grey">Memo</Td>
                  <Td>{props.proposal.memo}</Td>
                </Tr>
                <Tr>
                  <Td color="grey">Account</Td>
                  <Td>{props.proposal.account}</Td>
                </Tr>
                <Tr>
                  <Td color="grey">Data</Td>
                  <Td>{props.proposal.cdata}</Td>
                </Tr>

                <Tr>
                  <Td color="grey">Creation Date</Td>
                  <Td>{props.proposal.createdTime}</Td>
                </Tr>

                <Tr>
                  <Td color="grey">Stage</Td>
                  <Td>{props.proposal.stage} (4 hours remaining)</Td>
                </Tr>

                <Tr>
                  <Td color="grey">Status</Td>
                  <Td color="orange">{props.proposal.status}</Td>
                </Tr>

              </Tbody>
            </Table>
          </TableContainer>

          <StatGroup ml="1.5em">
            <Stat>
              <StatLabel>YES Votes</StatLabel>
              <StatNumber color="orange">{props.proposal.yesWeight}</StatNumber>
              <StatHelpText color="orange">
                23.36% of votes
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>NO Votes</StatLabel>
              <StatNumber color="green">{props.proposal.noWeight}</StatNumber>
              <StatHelpText color="green">
                77.44% of votes
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Total Votes</StatLabel>
              <StatNumber>{props.proposal.yesWeight + props.proposal.noWeight}</StatNumber>
              <StatHelpText>
                5% of all Respect
              </StatHelpText>
            </Stat>

          </StatGroup>

        </ModalBody>

        <ModalFooter>
          <Button colorScheme="green" mr={3}>Vote YES</Button>
          <Button colorScheme="red" mr={3}>Vote NO</Button>
          <Button colorScheme='blue' mr={3} onClick={props.onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}