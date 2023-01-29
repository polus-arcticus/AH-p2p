import {useState,useEffect} from 'react'

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
} from '@chakra-ui/react'

export const ConnectWallet = ({show, handleClose}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  useEffect(() => {
    if (show) {
      onOpen()
    }
  }, [show])

  return (
    <>
      <Modal onClose={() => {
          onClose()
          handleClose()
        }} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connect With</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
