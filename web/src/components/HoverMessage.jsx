import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
  Text
} from '@chakra-ui/react'

export const HoverMessage = ({
  hovered, handleClose, status, title, info, description
}) => {
  return (
    <Popover
      isOpen={hovered ? hovered: false}
      onClose={handleClose}
      >
      <PopoverContent>
        <PopoverArrow />
        <PopoverHeader>{title}</PopoverHeader>
        <Text>{description}</Text>
        <PopoverBody>
          {info}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  )
  
}
