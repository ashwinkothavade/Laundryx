import {
  Box,
  Button,
  Center,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
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
            <Box mb={['1rem', '2rem']}>
              <Text mb="0.5rem" fontSize={['1.1rem', '1.2rem']}>
                Username:{' '}
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
            <Box mb={['1rem', '2rem']}>
              <Text mb="0.5rem" fontSize={['1.1rem', '1.2rem']}>
                Password:{' '}
              </Text>
              <Box bg="#ffffff" borderRadius="0.4rem">
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
            </Box>
            <Center>
              {loading ? (
                <Spinner />
              ) : (
                <Button
                  type="submit"
                  letterSpacing={1}
                  mt={['1rem', '']}
                  px="4rem"
                  fontSize="1rem"
                  bg="#ce1567"
                  color="white"
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
          Don't have an account?
        </Text>
        <Text
          textAlign="center"
          fontSize={['1.1rem', '1.2rem']}
          color="#ce1567"
          fontWeight="600"
        >
          <Link to="/signup">Register</Link>
        </Text>
      </Stack>
    </Center>
  );
}
