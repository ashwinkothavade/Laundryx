import {
  Box,
  Button,
  Center,
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { BiHide, BiShow } from 'react-icons/bi';
import { HiArrowLongRight } from 'react-icons/hi2';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../Store/AuthStore';

const dev_env = import.meta.env.VITE_DEV_ENV;
axios.defaults.withCredentials = true;

export default function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const roleRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const { addAuth, setUserName, setUserEmail, setUserPhone, setUserRole } =
    useAuthStore((state) => ({
      addAuth: state.addAuth,
      setUserName: state.setUserName,
      setUserEmail: state.setUserEmail,
      setUserPhone: state.setUserPhone,
      setUserRole: state.setUserRole,
    }));

  const navigate = useNavigate();
  const toast = useToast();
  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      isClosable: true,
    });
  };
  useEffect(() => {
    // eslint-disable-next-line
    if (loading) {
    }
  }, [loading]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const credentials = {
      username: usernameRef.current.value,
      email: emailRef.current.value,
      password: passwordRef.current.value,
      role: roleRef.current.value,
      phone_number: phoneRef.current.value,
      confirmPassword: confirmPasswordRef.current.value,
    };

    if (
      !(
        credentials.email &&
        credentials.password &&
        credentials.username &&
        credentials.phone_number &&
        credentials.role
      )
    ) {
      handleToast('Incomplete Entries', 'Please enter all the fields', 'error');
      return;
    }
    if (credentials.password !== credentials.confirmPassword) {
      handleToast(
        'Password Mismatch',
        'Password and Confirm Password do not match',
        'error'
      );
      return;
    }
    setLoading(true);
    try {
      let response;
      if (dev_env === 'development') {
        response = await axios.post(
          'http://localhost:4000/signup',
          credentials
        );
      } else if (dev_env === 'production') {
        // eslint-disable-next-line no-unused-vars
        response = await axios.post(
          'https://laundrix-api.vercel.app/signup',
          credentials
        );
      }

      addAuth();
      setUserName(credentials.username);
      setUserEmail(credentials.email);
      setUserPhone(credentials.phone_number);
      setUserRole(credentials.role);
      handleToast(
        'Account Created',
        'You have successfully created an account',
        'success'
      );
      navigate('/');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      let errorDescription = '';
      if (err.response.data.errors.username) {
        errorDescription += err.response.data.errors.username;
      } else if (err.response.data.errors.email) {
        errorDescription += err.response.data.errors.email;
      } else if (err.response.data.errors.password) {
        errorDescription += err.response.data.errors.password;
      } else if (err.response.data.errors.role) {
        errorDescription += err.response.data.errors.role;
      } else if (err.response.data.errors.phone_number) {
        errorDescription += err.response.data.errors.phone_number;
      }
      handleToast('Error', errorDescription, 'error');
    }
  };

  return (
    <Stack align="center">
      <Text textAlign="center" fontSize={['1.7rem', '2.2rem']} fontWeight="600">
        Register With Us
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
          {/* Username and Phone */}
          <Flex gap="2rem">
            <Box mb={['1rem', '1.5rem']}>
              <Text mb="0.5rem" fontSize="1.1rem">
                Username
              </Text>
              <Box bg="#ffffff" borderRadius="0.4rem">
                <Input
                  type="text"
                  focusBorderColor="#ce1567"
                  bg="#ecedf6"
                  id="username"
                  name="username"
                  ref={usernameRef}
                  placeholder="Name..."
                />
              </Box>
            </Box>
            <Box mb={['1rem', '1.5rem']}>
              <Text mb="0.5rem" fontSize="1.1rem">
                Phone
              </Text>
              <Box bg="#ffffff" borderRadius="0.4rem">
                <Input
                  type="text"
                  focusBorderColor="#ce1567"
                  bg="#ecedf6"
                  id="phone_number"
                  name="phone_number"
                  ref={phoneRef}
                  placeholder="Phone..."
                />
              </Box>
            </Box>
          </Flex>
          {/* Email */}
          <Box mb={['1rem', '1.5rem']}>
            <Text mb="0.5rem" fontSize="1.1rem">
              Email
            </Text>
            <Box bg="#ffffff" borderRadius="0.4rem">
              <Input
                type="email"
                focusBorderColor="#ce1567"
                bg="#ecedf6"
                id="email"
                name="email"
                ref={emailRef}
                placeholder="Email..."
              />
            </Box>
          </Box>
          {/* Password */}
          <Box mb={['1rem', '1.5rem']}>
            <Text mb="0.5rem" fontSize="1.1rem">
              Password
            </Text>
            <Box bg="#ffffff" borderRadius="0.4rem">
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  focusBorderColor="#ce1567"
                  bg="#ecedf6"
                  id="password"
                  name="password"
                  ref={passwordRef}
                  placeholder="Password..."
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
          {/* Confirm Password */}
          <Box mb={['1rem', '1.5rem']}>
            <Text mb="0.5rem" fontSize="1.1rem">
              Confirm Password
            </Text>
            <Box bg="#ffffff" borderRadius="0.4rem">
              <InputGroup>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  focusBorderColor="#ce1567"
                  bg="#ecedf6"
                  id="confirmPassword"
                  name="confirmPassword"
                  ref={confirmPasswordRef}
                  placeholder="Confirm Password..."
                />
                <InputRightElement
                  onClick={() => {
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                >
                  {showConfirmPassword ? (
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
          <Box mb={['1rem', '1.5rem']}>
            <Text mb="0.5rem" fontSize="1.1rem">
              Select Role
            </Text>
            <Box bg="#ffffff" borderRadius="0.4rem">
              <Select
                focusBorderColor="#ce1567"
                bg="#ecedf6"
                id="role"
                name="role"
                ref={roleRef}
              >
                <option value="" disabled selected>
                  Select Role
                </option>
                <option value="launderer">Launderer</option>
                <option value="student">Student</option>
              </Select>
            </Box>
          </Box>
          <Center>
            {loading ? (
              <Button isLoading loadingText="Logging In...">
                Create Account
              </Button>
            ) : (
              <Button
                type="submit"
                letterSpacing={1}
                mt={['1rem', '']}
                px="2rem"
                fontSize="1rem"
                bg="#ce1567"
                color="white"
                _hover={{
                  bg: '',
                }}
                rightIcon={<HiArrowLongRight color="#ffffff" size="1.5rem" />}
              >
                Create Account
              </Button>
            )}
          </Center>
        </form>
      </Flex>
      <Text textAlign="center" fontSize={['1.1rem', '1.2rem']}>
        Already have an account?{' '}
        <span
          style={{
            color: '#CE1567',
            fontWeight: 600,
            textDecoration: 'underline',
          }}
        >
          <Link to="/login">Log In</Link>
        </span>
      </Text>
    </Stack>
  );
}
