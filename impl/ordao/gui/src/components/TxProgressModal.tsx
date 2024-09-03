import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button,
  Center,
} from '@chakra-ui/react'
import { Spinner } from '@chakra-ui/react'
import { ReactNode } from 'react';

export type TxProgressModalProps = {
  isOpen: boolean;
  onClose: () => void;
  operationStr: string;
  children: ReactNode,
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
            {props.children}          
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