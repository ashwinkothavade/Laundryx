import {
  Button,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  Avatar,
  useToast,
  TagLeftIcon,
  Tag,
  TagLabel,
} from '@chakra-ui/react';
import { BiUserCheck, BiUserPlus, BiLogOut } from 'react-icons/bi';
import { GiHamburgerMenu } from 'react-icons/gi';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../Store/AuthStore';

function Navbar() {
  const {
    isAuth,
    removeAuth,
    userName,
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

  const navigate = useNavigate();
  const toast = useToast();

  const logOut = async () => {
    try {
      const response = await axios.get('http://localhost:4000/logout');
      toast({
        title: 'Success',
        description: 'User Logged Out Successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      console.log(response.data);
      removeAuth();
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
            <Link to="/dashboard">
              <Tag
                size="lg"
                variant="subtle"
                bg="#edf2f7"
                cursor="pointer"
                borderRadius="0.5rem"
                py="0.25rem"
                _hover={{
                  bg: '#dbdbdb',
                  color: '#ce1567',
                }}
              >
                <Flex align="center" my="0.025rem">
                  <TagLeftIcon
                    boxSize="12px"
                    // eslint-disable-next-line
                as={() => <Avatar name={userName} size="sm" />}
                  />
                  <TagLabel>
                    <Text
                      color="#584BAC"
                      fontWeight="600"
                      fontSize={['0.4rem', '0.5rem', '0.8rem', '1.2rem']}
                      ml={['12px', '15px', '15px', '20px']}
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
            border="3px solid #584bac"
            borderRadius="1.2rem"
            icon={<GiHamburgerMenu size="1.5rem" color="#584bac" />}
            variant="outline"
          />

          {isAuth ? (
            <MenuList fontSize="1.1rem">
              <MenuItem>
                <Avatar name={userName} size="sm" />
              </MenuItem>
              <MenuItem
                icon={<BiLogOut size="1.5rem" color="#584bac" />}
                onClick={() => logOut()}
              >
                Logout
              </MenuItem>
            </MenuList>
          ) : (
            <MenuList>
              <MenuItem
                icon={<BiUserCheck size="1.7rem" color="#584bac" />}
                onClick={() => navigate('/login')}
              >
                Log In
              </MenuItem>
              <MenuItem
                icon={<BiUserPlus size="1.7rem" color="#584bac" />}
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
