import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  Button,
} from '@chakra-ui/react'

export type SubmitBreakoutResModal = {
  isOpen: boolean;
  consensusId: string,
  onClose: () => void;
  onSubmit: () => void;
}

export default function SubmitBreakoutResModal(props: SubmitBreakoutResModal) {

  return (
    <Modal size="md" isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="2xl">
          Submit breakout results
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>
            Please make sure submission represents consensus of a group.
            <br/><br/>
            To help with that, check with other members if they see the same character sequence here: <b>{props.consensusId}</b>
            <br/><br/>
            If it's the same your submissions are identical (so you're in consensus).
          </Text>
        </ModalBody>

        <ModalFooter>
          <Button
            width="100%"
            colorScheme='blue'
            onClick={props.onSubmit}
          >
            Push it on chain!
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}