import {
  Box,
  Flex,
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  // useDisclosure,
  useColorModeValue,
  Stack,
  // useColorMode,
  Center,
} from '@chakra-ui/react'

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
  onNewPropClick: () => void;
}

export default function AppBar(props: AppBarProps) {
  // const { colorMode, toggleColorMode } = useColorMode()
  // const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Box w="100%" bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
      <Flex h={16} w="100%" alignItems={'center'} justifyContent={'space-between'}>
        <Box as="b" fontSize="larger">Optimism Fractal</Box>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            {/* <Button onClick={toggleColorMode}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button> */}

            <Button onClick={props.onNewPropClick}>Create Proposal</Button>

            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}>
                <Avatar
                  size={'sm'}
                  src={'https://avatars.dicebear.com/api/male/username.svg'}
                />
              </MenuButton>
              <MenuList alignItems={'center'}>
                <br />
                <Center>
                  <Avatar
                    size={'2xl'}
                    src={'https://avatars.dicebear.com/api/male/username.svg'}
                  />
                </Center>
                <br />
                <Center>
                  <p>Username BBA</p>
                </Center>
                <br />
                <MenuDivider />
                {/* <MenuItem>Your Servers</MenuItem> */}
                {/* <MenuItem>Account Settings</MenuItem> */}
                <MenuItem>Logout</MenuItem>
              </MenuList>
            </Menu>
          </Stack>
        </Flex>
      </Flex>
    </Box>
  )
}