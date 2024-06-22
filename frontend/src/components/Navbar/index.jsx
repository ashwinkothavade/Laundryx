import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  IconButton,
  List,
  ListIcon,
  ListItem,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Tag,
  TagLabel,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { BiBell, BiLogOut, BiUserCheck, BiUserPlus } from 'react-icons/bi';
import { GiHamburgerMenu } from 'react-icons/gi';
import { IoIosClose } from 'react-icons/io';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../Store/AuthStore';
import { deleteNotif, fetchNotifs, logout } from '../../utils/apis';

function Navbar() {
  const {
    isAuth,
    removeAuth,
    userName,
    userNotifications,
    unreadCount,
    updateUserNotifications,
    clearUserNotifications,
    removeUserNotification,
    setUnreadCount,
    setUserRole,
    setUserName,
    setUserPhone,
    setUserEmail,
    setUserHostel,
    setUserRoomNumber,
    setUserRollNumber,
  } = useAuthStore((state) => ({
    isAuth: state.isAuth,
    userName: state.userName,
    userNotifications: state.userNotifications,
    unreadCount: state.unreadCount,
    updateUserNotifications: state.updateUserNotifications,
    clearUserNotifications: state.clearUserNotifications,
    removeUserNotification: state.removeUserNotification,
    setUnreadCount: state.setUnreadCount,
    addAuth: state.addAuth,
    removeAuth: state.removeAuth,
    setUserName: state.setUserName,
    setUserRole: state.setUserRole,
    setUserEmail: state.setUserEmail,
    setUserPhone: state.setUserPhone,
    setUserHostel: state.setUserHostel,
    setUserRoomNumber: state.setUserRoomNumber,
    setUserRollNumber: state.setUserRollNumber,
  }));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetchNotifs();
        if (
          !response.data.notifications ||
          response.data.notifications.length === 0
        ) {
          console.log('No notifs');
          return;
        }
        updateUserNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Error fetching notifications', error);
      }
    };

    if (isAuth) {
      fetchNotifications();
    }
  }, [isAuth, updateUserNotifications, setUnreadCount]);

  const logOut = async () => {
    try {
      // eslint-disable-next-line
      const response = await logout();
      toast({
        title: 'Success',
        description: 'User Logged Out Successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      removeAuth();
      clearUserNotifications();
      setUnreadCount(0);
      setUserName(null);
      setUserRole(null);
      setUserEmail(null);
      setUserPhone(null);
      setUserHostel(null);
      setUserRoomNumber(null);
      setUserRollNumber(null);
      navigate('/');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Unauthorized',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
        onCloseComplete: () => {
          navigate('/login');
        },
      });
      removeAuth();
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await deleteNotif(id);

      if (response.status === 200) {
        setUnreadCount((prevCount) => prevCount - 1);
        removeUserNotification(id);
      }
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  return (
    <Flex
      align="center"
      w="100%"
      position="fixed"
      top="0%"
      h={['50px', '55px', '70px']}
      boxShadow="0px 2px 3px lightgray"
      pr={['15px', '30px']}
      bgColor="white"
      zIndex="1"
    >
      <Link to="/">
        <Text
          color="#584BAC"
          fontWeight="600"
          fontSize={['1.5rem', '1.7rem', '2.3rem', '2.7rem']}
          ml={['20px', '30px', '40px', '50px']}
        >
          LaundriX
        </Text>
      </Link>
      <Spacer />
      <Flex display={{ base: 'none', md: 'block' }}>
        {isAuth ? (
          <Flex justify="center" align="center" gap="1.5rem">
            <Menu>
              <MenuButton
                as={Button}
                borderRadius="0.5rem"
                variant="ghost"
                cursor="pointer"
                position="relative"
              >
                <BiBell
                  className={unreadCount > 0 ? 'bell-icon' : ''}
                  size={28}
                  color="#584bac"
                  _hover={{
                    color: '#ce1567',
                  }}
                />
                {unreadCount > 0 && (
                  <Badge
                    colorScheme="red"
                    borderRadius="full"
                    position="absolute"
                    top="0"
                    right="0"
                    fontSize="0.8rem"
                    p="0.2rem 0.4rem"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </MenuButton>
              <MenuList
                border="2px solid #ce1584"
                borderRadius="0.5rem"
                p="1rem"
              >
                {userNotifications.length > 0 ? (
                  <List spacing={3}>
                    {userNotifications.map((notification, index) => (
                      <ListItem key={index}>
                        <Flex align="center">
                          <ListIcon as={BiBell} color="#ce1584" />
                          {notification.message}
                          <Button
                            size="md"
                            ml="auto"
                            onClick={() => deleteNotification(notification._id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '4px 8px',
                              borderRadius: 8,
                              border: 'none',
                              backgroundColor: 'transparent',
                            }}
                          >
                            <IoIosClose color="red" />
                          </Button>
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <MenuItem>No notifications</MenuItem>
                )}
              </MenuList>
            </Menu>
            <Link to="/dashboard">
              <Tag
                size="lg"
                cursor="pointer"
                borderRadius="full"
                py="0.4rem"
                px="1rem"
                _hover={{
                  bg: '#dbdbdb',
                }}
                transition="0.2s"
              >
                <Flex align="center" my="0.025rem">
                  <Avatar name={userName} size="sm" ml={-1} mr={2} />
                  <TagLabel>
                    <Text
                      color="#584BAC"
                      fontWeight="600"
                      fontSize={['0.4rem', '0.5rem', '0.8rem', '1.2rem']}
                      _hover={{
                        bg: '#dbdbdb',
                        color: '#ce1567',
                      }}
                    >
                      Account
                    </Text>
                  </TagLabel>
                </Flex>
              </Tag>
            </Link>
            <Button
              borderRadius="0.5rem"
              fontSize="1.1rem"
              px="2rem"
              color="#584BAC"
              _hover={{
                bg: '#dbdbdb',
                color: '#ce1567',
              }}
              onClick={logOut}
            >
              Log Out
            </Button>
          </Flex>
        ) : (
          <Flex>
            <Button
              borderRadius="0.5rem"
              fontSize="1.1rem"
              px="2rem"
              _hover={{
                color: '#ce1567',
              }}
              onClick={() => navigate('/login')}
            >
              Log In
            </Button>
            <Button
              bg="#ce1567"
              color="#ffffff"
              fontSize="1.1rem"
              px="2rem"
              ml="1.5rem"
              _hover={{ bg: '#bf0055' }}
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </Button>
          </Flex>
        )}
      </Flex>

      {/* For Phone Viewport */}
      <Flex display={{ base: 'block', md: 'none' }}>
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            border="none"
            icon={<GiHamburgerMenu size={30} color="#584bac" />}
            variant="outline"
            bg="transparent"
          />
          {isAuth ? (
            <MenuList fontSize="1.1rem">
              <Link to="/dashboard">
                <MenuItem icon={<Avatar name={userName} size="sm" />}>
                  Dashboard
                </MenuItem>
              </Link>
              <MenuItem
                icon={
                  <Box position="relative">
                    <BiBell
                      className={unreadCount > 0 ? 'bell-icon' : ''}
                      size={24}
                      color="#584bac"
                      _hover={{
                        color: '#ce1567',
                      }}
                    />
                    {unreadCount > 0 && (
                      <Badge
                        colorScheme="red"
                        borderRadius="full"
                        position="absolute"
                        top="-1"
                        right="-1"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Box>
                }
                onClick={onOpen}
              >
                Notifications
              </MenuItem>

              <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent>
                  <DrawerCloseButton />
                  <DrawerHeader>Notifications</DrawerHeader>

                  <DrawerBody>
                    {userNotifications.length > 0 ? (
                      <List spacing={3}>
                        {userNotifications.map((notification, index) => (
                          <ListItem key={index}>
                            <Flex align="center">
                              <ListIcon as={BiBell} color="#ce1584" />
                              {notification.message}
                              <Button
                                size="md"
                                ml="auto"
                                onClick={() =>
                                  deleteNotification(notification._id)
                                }
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '4px 8px',
                                  borderRadius: 8,
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                }}
                              >
                                <IoIosClose color="red" />
                              </Button>
                            </Flex>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <MenuItem>No notifications</MenuItem>
                    )}
                  </DrawerBody>
                </DrawerContent>
              </Drawer>

              <MenuItem
                icon={<BiLogOut size={24} color="#584bac" />}
                onClick={() => logOut()}
              >
                Logout
              </MenuItem>
            </MenuList>
          ) : (
            <MenuList>
              <MenuItem
                icon={<BiUserCheck size={24} color="#584bac" />}
                onClick={() => navigate('/login')}
              >
                Log In
              </MenuItem>
              <MenuItem
                icon={<BiUserPlus size={24} color="#584bac" />}
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </MenuItem>
            </MenuList>
          )}
        </Menu>
      </Flex>
    </Flex>
  );
}

export default Navbar;
