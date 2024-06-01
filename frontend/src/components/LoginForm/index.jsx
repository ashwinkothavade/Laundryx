import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRef, useState } from 'react';
import { BiHide, BiShow } from 'react-icons/bi';
import { HiArrowLongRight } from 'react-icons/hi2';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../Store/AuthStore';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = useRef();

  const { addAuth, setUserName, setUserRole, setUserEmail, setUserPhone } =
    useAuthStore((state) => ({
      addAuth: state.addAuth,
      setUserName: state.setUserName,
      setUserRole: state.setUserRole,
      setUserEmail: state.setUserEmail,
      setUserPhone: state.setUserPhone,
    }));
  // password global state mein store nahi karna hai imo.
  const { username, password } = loginData;

  const navigate = useNavigate();
  const toast = useToast();

  const onChange = (e) => {
    setLoginData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!(username && password)) {
      toast({
        title: 'Incomplete Entries',
        description: 'Please enter both email and password',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:4000/login',
        loginData
      );
      addAuth();
      console.log(response);
      setUserName(username);
      setUserRole(response.data.role);
      setUserEmail(response.data.email);
      setUserPhone(response.data.phone_number);
      toast({
        title: 'Success',
        description: 'Successfully logged in!',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      navigate('/');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      let errorDescription = '';
      if (err.response.data.errors.username) {
        errorDescription += err.response.data.errors.username;
      } else if (err.response.data.errors.password) {
        errorDescription += err.response.data.errors.password;
      }
      toast({
        title: 'Error',
        description: errorDescription,
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  // Method to handle forgot password
  const handleForgotPassword = (e) => {
    e.preventDefault();
    const email = initialRef.current.value;
    try {
      if (email) {
        // eslint-disable-next-line no-unused-vars
        const response = axios.post(
          'http://localhost:4000/forgotpassword',
          { email },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
        toast({
          title: 'Success',
          description: 'Password reset link is sent to your email',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
      } else {
        throw new Error('Please enter your email');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
    }
    onClose();
  };

  return (
    <Center m={0} p={0}>
      <Stack>
        <Text
          textAlign="center"
          color=""
          fontSize={['1.7rem', '2.2rem']}
          fontWeight="600"
          mb="1rem"
        >
          Log In
        </Text>
        <Flex
          direction="column"
          border="2px solid #ce1567"
          w={['20rem', '27rem']}
          px={['1rem', '2rem']}
          py={['1rem', '2rem']}
          borderRadius="0.8rem"
          mb="1rem"
        >
          <form onSubmit={onSubmit}>
            <Box mb={['1rem', '1.5rem']}>
              <Text mb="0.5rem" fontSize={['1.1rem', '1.1rem']}>
                Username
              </Text>
              <Box bg="#ffffff" borderRadius="0.4rem">
                <Input
                  type="text"
                  focusBorderColor="#ce1567"
                  bg="#ecedf6"
                  id="username"
                  name="username"
                  value={username}
                  placeholder="Enter your username  ..."
                  onChange={onChange}
                />
              </Box>
            </Box>
            <Box mb="1rem">
              <Text mb="0.5rem" fontSize={['1.1rem', '1.1rem']}>
                Password
              </Text>
              <Box bg="#ffffff" borderRadius="0.4rem" mb={1}>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    focusBorderColor="#ce1567"
                    bg="#ecedf6"
                    id="password"
                    name="password"
                    value={password}
                    placeholder="Enter your password..."
                    onChange={onChange}
                  />
                  <InputRightElement
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                  >
                    {showPassword ? (
                      <BiHide
                        style={{ width: '20px', height: '20px' }}
                        color="#3d3d3d"
                      />
                    ) : (
                      <BiShow
                        style={{ width: '20px', height: '20px' }}
                        color="#3d3d3d"
                      />
                    )}
                  </InputRightElement>
                </InputGroup>
              </Box>
              <Text color="#CE1567" as="u" cursor="pointer" onClick={onOpen}>
                Forgot Password?
              </Text>
              <Modal
                isOpen={isOpen}
                onClose={onClose}
                initialFocusRef={initialRef}
              >
                <ModalOverlay />
                <ModalContent border="2px solid #ce1567" borderRadius="1rem">
                  <ModalHeader>Forgot Password?</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <FormControl>
                      <FormLabel fontSize="1.1rem">Email Address:</FormLabel>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        ref={initialRef}
                      />
                    </FormControl>
                  </ModalBody>

                  <ModalFooter justifyContent="center">
                    <Button
                      bg="#CE1567"
                      color="#FFFFFF"
                      _hover={{
                        bg: '',
                      }}
                      onClick={(e) => handleForgotPassword(e)}
                    >
                      Send Request
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </Box>
            <Center>
              {loading ? (
                <Spinner />
              ) : (
                <Button
                  type="submit"
                  mt={['1rem', '']}
                  px="2rem"
                  bg="#CE1567"
                  color="#FFFFFF"
                  _hover={{
                    bg: '',
                  }}
                  rightIcon={<HiArrowLongRight color="#ffffff" size="1.5rem" />}
                >
                  Log In
                </Button>
              )}
            </Center>
          </form>
        </Flex>
        <Text textAlign="center" fontSize={['1.1rem', '1.2rem']}>
          Don't have an account?{' '}
          <span style={{ color: '#CE1567', fontWeight: 600 }}>
            <Link to="/signup">Register</Link>
          </span>
        </Text>
      </Stack>
    </Center>
  );
}
