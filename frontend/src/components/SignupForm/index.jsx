import axios from 'axios';
import { useEffect, useState } from 'react';
import { BiHide, BiShow } from 'react-icons/bi';
import { HiArrowLongRight } from 'react-icons/hi2';
import { Link, useNavigate } from 'react-router-dom';
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
import useAuthStore from '../Store/AuthStore';

axios.defaults.withCredentials = true;

export default function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupData, setSignupData] = useState({
    username: '',
    phone_number: '',
    email: '',
    role: '',
    password: '',
  });
  const { username, phone_number, email, role, password } = signupData;
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

  const onChange = (e) => {
    setSignupData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    // eslint-disable-next-line
    if (loading) {
    }
  }, [loading]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!(email && password && username && phone_number && role)) {
      toast({
        title: 'Incomplete Entries',
        description: 'Please enter all the fields',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Password and Confirm Password do not match',
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
        'http://localhost:4000/signup',
        signupData
      );

      addAuth();
      console.log(response);
      setUserName(username);
      setUserEmail(email);
      setUserPhone(phone_number);
      setUserRole(role);
      toast({
        title: 'Account Created',
        description: 'You have successfully created an account',
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
      } else if (err.response.data.errors.email) {
        errorDescription += err.response.data.errors.email;
      } else if (err.response.data.errors.password) {
        errorDescription += err.response.data.errors.password;
      } else if (err.response.data.errors.role) {
        errorDescription += err.response.data.errors.role;
      } else if (err.response.data.errors.phone_number) {
        errorDescription += err.response.data.errors.phone_number;
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
          fontSize={['1.7rem', '2.2rem']}
          fontWeight="600"
          mb="1rem"
        >
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
              <Box mb={['1rem', '2rem']}>
                <Text mb="0.5rem" fontSize={['1.1rem', '1.2rem']}>
                  Name:{' '}
                </Text>
                <Box bg="#ffffff" borderRadius="0.4rem">
                  <Input
                    type="text"
                    focusBorderColor="#ce1567"
                    bg="#ecedf6"
                    id="username"
                    name="username"
                    value={username}
                    placeholder="Name..."
                    onChange={onChange}
                  />
                </Box>
              </Box>
              <Box mb={['1rem', '2rem']}>
                <Text mb="0.5rem" fontSize={['1.1rem', '1.2rem']}>
                  Phone:{' '}
                </Text>
                <Box bg="#ffffff" borderRadius="0.4rem">
                  <Input
                    type="text"
                    focusBorderColor="#ce1567"
                    bg="#ecedf6"
                    id="phone_number"
                    name="phone_number"
                    value={phone_number}
                    placeholder="Phone..."
                    onChange={onChange}
                  />
                </Box>
              </Box>
            </Flex>
            {/* Email */}
            <Box mb={['1rem', '2rem']}>
              <Text mb="0.5rem" fontSize={['1.1rem', '1.2rem']}>
                Email:{' '}
              </Text>
              <Box bg="#ffffff" borderRadius="0.4rem">
                <Input
                  type="email"
                  focusBorderColor="#ce1567"
                  bg="#ecedf6"
                  id="email"
                  name="email"
                  value={email}
                  placeholder="Email..."
                  onChange={onChange}
                />
              </Box>
            </Box>
            {/* Password */}
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
                    placeholder="Password..."
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
            {/* Confirm Password */}
            <Box mb={['1rem', '2rem']}>
              <Text mb="0.5rem" fontSize={['1.1rem', '1.2rem']}>
                Confirm Password:{' '}
              </Text>
              <Box bg="#ffffff" borderRadius="0.4rem">
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    focusBorderColor="#ce1567"
                    bg="#ecedf6"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    placeholder="Confirm Password..."
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
            <Box mb={['1rem', '2rem']}>
              <Text mb="0.5rem" fontSize={['1.1rem', '1.2rem']}>
                Select Role:{' '}
              </Text>
              <Box bg="#ffffff" borderRadius="0.4rem">
                <Select
                  focusBorderColor="#ce1567"
                  bg="#ecedf6"
                  id="role"
                  name="role"
                  value={role}
                  onChange={onChange}
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
                  px="4rem"
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
          Already have an account?
        </Text>
        <Text
          textAlign="center"
          fontSize={['1.1rem', '1.2rem']}
          color="#ce1567"
          fontWeight="600"
        >
          <Link to="/login">Log In Now</Link>
        </Text>
      </Stack>
    </Center>
  );
}
