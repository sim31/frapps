import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Text,
  Button,
  Center,
} from '@chakra-ui/react'
import { Spinner } from '@chakra-ui/react'

export type TxProgressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  operationStr: string;
  progressStr: string;
  done: boolean;
}

export default function TxProgressModal(props: TxProgressModalProps) {

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="2xl">
          {props.operationStr}
        </ModalHeader>
        <ModalBody>
          <Center>
            <Text noOfLines={4}>
              {props.progressStr}
            </Text>
            <br></br>
            {!props.done && <Spinner/>}
          </Center>
        </ModalBody>

        <ModalFooter>
          {props.done &&
            <Button onClick={props.onClose}>
              Close
            </Button>
          }
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}