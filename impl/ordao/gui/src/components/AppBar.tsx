import {
  Box,
  Flex,
  // Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  // MenuDivider,
  // useDisclosure,
  useColorModeValue,
  Stack,
  useToast,
  // useColorMode,
  // Center,
} from '@chakra-ui/react'
import copy from 'copy-to-clipboard'
import { useCallback } from 'react'
import { formatEthAddress } from 'eth-address'

// interface Props {
//   children: React.ReactNode
// }

// const NavLink = (props: Props) => {
//   const { children } = props

//   return (
//     <Box
//       as="a"
//       px={2}
//       py={1}
//       rounded={'md'}
//       _hover={{
//         textDecoration: 'none',
//         bg: useColorModeValue('gray.200', 'gray.700'),
//       }}
//       href={'#'}>
//       {children}
//     </Box>
//   )
// }

export type AppBarProps = {
  // onNewPropClick: () => void;
  title: string,
  loggedInUser?: string,
  onLogout: () => void,
  onLogin: () => void
}

export default function AppBar(props: AppBarProps) {
  // const { colorMode, toggleColorMode } = useColorMode()
  // const { isOpen, onOpen, onClose } = useDisclosure()

  const toast = useToast();

  const copyUsername = useCallback(() => {
    if (props.loggedInUser) {
      copy(props.loggedInUser)
      toast({
        title: 'Address copied to clipboard!',
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
    }
  }, [props, toast])

  return (
    <Box w="100%" bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
      <Flex h={16} w="100%" alignItems={'center'} justifyContent={'space-between'}>
        <Box paddingLeft="0.5em" as="b" fontSize="larger">{props.title}</Box>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            {/* <Button onClick={toggleColorMode}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button> */}

            {/* <Button onClick={props.onNewPropClick}>Create Proposal</Button> */}
            <Menu>
              { props.loggedInUser ? (
                <>
                  <MenuButton
                    as={Button}
                    rounded={'full'}
                    variant={'link'}
                    cursor={'pointer'}
                    minW={0}
                  >
                    {formatEthAddress(props.loggedInUser, 4)}
                  </MenuButton>
                  <MenuList alignItems={'center'}>
                    {/* <MenuItem>Your Servers</MenuItem> */}
                    {/* <MenuItem>Account Settings</MenuItem> */}
                    <MenuItem onClick={copyUsername}>Copy</MenuItem>
                    <MenuItem onClick={props.onLogout}>Logout</MenuItem>
                  </MenuList>
                </>
              ) : (
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                  onClick={props.onLogin}
                >
                  Login
                </MenuButton>
              )}
            </Menu>
          </Stack>
        </Flex>
      </Flex>
    </Box>
  )
}