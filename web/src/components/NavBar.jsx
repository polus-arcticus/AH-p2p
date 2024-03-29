import {useState,useEffect} from 'react'
import {useWeb3React} from '@web3-react/core'
import { useIpfs } from '@/hooks/useIpfs'
import { SiIpfs } from 'react-icons/si'

import {
  Container,
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorMode,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react';
import {
  MoonIcon,
  SunIcon,
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { Link as RouterLink} from 'react-router-dom'
import { ConnectWallet } from './ConnectWallet'
import { substringAddr } from './Utils'
const chainIdToName = (id) => {
  switch (id) {
    case 1:
      return 'mainnet'
      break
    case 1337:
      return 'localhost'
      break
    default:
      return 'Select Network'
  }
}

export const NavBar = () => {
  const {ipfs, error:ipfsError, starting:ipfsStarting} = useIpfs()
  const {networkName, setNetworkName} = useState('')
  const { accounts, chainId } = useWeb3React()
  const [showWalletModal, setShowWalletModal] = useState(false)
  const handleClose = () => {
    setShowWalletModal(false)
  }
  const { isOpen, onToggle } = useDisclosure();
  const { colorMode, toggleColorMode  } = useColorMode();

  return (
    <Container maxW={'6xl'}>
      <Box >
        <Flex
          bg={useColorModeValue('white', 'gray.800')}
          color={useColorModeValue('gray.600', 'white')}
          minH={'60px'}
          py={{ base: 2 }}
          px={{ base: 4 }}
          borderBottom={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.900')}
          align={'center'}>
          <Flex
            flex={{ base: 1, md: 'auto' }}
            ml={{ base: -2 }}
            display={{ base: 'flex', md: 'none' }}>
            <IconButton
              onClick={onToggle}
              icon={
                isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
              }
              variant={'ghost'}
              aria-label={'Toggle Navigation'}
            />
          </Flex>
          <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
            <Text
              textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
              fontFamily={'heading'}
              color={useColorModeValue('gray.800', 'white')}>
              <RouterLink to="">AH-p2p</RouterLink>
            </Text>

            <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
              <DesktopNav />
            </Flex>
          </Flex>

          <Stack
            flex={{ base: 1, md: 0 }}
            justify={'flex-end'}
            direction={'row'}
            spacing={6}>
            <Button
              as={'a'}
              fontSize={'sm'}
              fontWeight={400}
              variant={'link'}
              onClick={() => {}}
            >
              {chainIdToName(chainId)}
            </Button>
            <Button
              display={{ base: 'none', md: 'inline-flex' }}
              fontSize={'sm'}
              fontWeight={600}
              onClick={() => { setShowWalletModal(!showWalletModal) }}
            >
                {accounts ? substringAddr(accounts[0]) : 'Connect Wallet'}
            </Button>
            <Button
              sx={{
                border: `1px solid ${
                  ipfsError ? 'red':
                  ipfsStarting ? 'yellow':'green'

              }`
              }}
              variant="outlined"
              onClick={() => {}}>
              <Icon as={SiIpfs}/>
            </Button>
            <Button onClick={toggleColorMode}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>
          </Stack>
        </Flex>

        <Collapse in={isOpen} animateOpacity>
          <MobileNav />
        </Collapse>
      </Box>
      <ConnectWallet show={showWalletModal} handleClose={handleClose} />
    </Container>
  );
}

const DesktopNav = () => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <RouterLink
                p={2}
                to={navItem.href ?? '#'}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}>
                {navItem.label}
              </RouterLink>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}>
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel }) => {
  return (
    <RouterLink
      to={href}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: useColorModeValue('pink.50', 'gray.900') }}>
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'pink.400' }}
            fontWeight={500}>
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}>
          <Icon color={'pink.400'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </RouterLink>
  );
};

const MobileNav = () => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}>
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Flex
        py={2}
        as={Link}
        href={href ?? '#'}
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}>
        <Text
          fontWeight={600}
          color={useColorModeValue('gray.600', 'gray.200')}>
          {label}
        </Text>
        {children && (
          <Icon
            as={ChevronDownIcon}
            transition={'all .25s ease-in-out'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            w={6}
            h={6}
          />
        )}
      </Flex>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}>
          {children &&
              children.map((child) => (
                <RouterLink key={child.label} py={2} to={child.href}>
                  {child.label}
                </RouterLink>
              ))}
        </Stack>
      </Collapse>
    </Stack>

  );
};

const NAV_ITEMS = [
  {
    label: 'Auctions',
    href: '/auctions/',
    children: [
      {
        label: 'Active Auctions',
        subLabel: 'Find Nfts currently being auctioned in open lobbies',
        href: '/auctions/active',
      },
      {
        label: 'Archived Auctions',
        subLabel: 'Available historical records of past auctions youve engaged with',
        href: '/auctions/archived',
      },
      {
        label: 'Create Auction',
        subLabel: 'List your own NFT for auction',
        href: '/auctions/create',
      },
    ],
  },
  {
    label: 'Docs',
    href: '/docs/',
    children: [
      {
        label: 'Guide',
        subLabel: 'Learn how to use the auction house',
        href: '/docs/guide',
      },
      {
        label: 'How they work',
        subLabel: 'Learn how the auction house works under the hood',
        href: '/docs/work',
      }
    ],
  },
];
