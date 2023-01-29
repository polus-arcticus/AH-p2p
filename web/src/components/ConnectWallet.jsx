import {useState,useEffect} from 'react'
import {useWeb3React} from '@web3-react/core'
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
  const {connector} = useWeb3React()
  useEffect(() => {
    if (show) {
      onOpen()
    }
  }, [show])
  const handleConnectMetamask = async () => {
    await connector.activate()
    onClose()
  }

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
            <Button width="100%" variant="outline"
              onClick={handleConnectMetamask}>Metamask</Button>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
