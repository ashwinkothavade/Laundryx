import { Box, Button, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../Navbar';

const BRAND = '#584BAC';
const ACCENT = '#CE1567';

// The chrome every role's dashboard shares: the navbar, a section list, and
// the panel for the selected section.
//
// The section lives in the URL (/dashboard/<key>) rather than in component
// state. As local state it could not be linked to, bookmarked, or returned to
// with the back button — the back button left the dashboard entirely, which
// is most of why moving around the app felt like guesswork.
function DashboardShell({ title, tabs, banner }) {
  const { tab } = useParams();
  const navigate = useNavigate();

  const current = tabs.findIndex((t) => t.key === tab);
  // An unknown or missing section resolves to the first one, replacing the
  // history entry so Back doesn't bounce off the bad URL.
  if (current === -1) {
    return <Navigate to={`/dashboard/${tabs[0].key}`} replace />;
  }
  const active = tabs[current];

  return (
    <>
      <Helmet>
        <title>{`LaundriX - ${active.label}`}</title>
        <meta name="description" content={`${active.label} on LaundriX`} />
      </Helmet>
      <Navbar />
      <Flex direction={{ base: 'column', md: 'row' }}>
        <Box
          position={{ base: 'sticky', md: 'fixed' }}
          top={{ base: '50px', md: '70px' }}
          left={0}
          bottom={{ base: 'auto', md: 0 }}
          w={{ base: '100%', md: '15rem' }}
          bg="white"
          zIndex={1}
          boxShadow={{
            base: '0px 2px 3px lightgray',
            md: '1px 0 3px lightgray',
          }}
          px={{ base: '0.75rem', md: '1.25rem' }}
          py={{ base: '0.5rem', md: '1.5rem' }}
          mt={{ base: '50px', xs: '55px', sm: '70px', md: 0 }}
        >
          <Text
            display={{ base: 'none', md: 'block' }}
            fontWeight={700}
            fontSize="0.75rem"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="gray.400"
            mb="1rem"
          >
            {title}
          </Text>
          {/* Scrolls sideways on a phone instead of crushing every label. */}
          <Stack
            direction={{ base: 'row', md: 'column' }}
            gap={{ base: 2, md: 1 }}
            overflowX={{ base: 'auto', md: 'visible' }}
            pb={{ base: '0.25rem', md: 0 }}
            sx={{
              '&::-webkit-scrollbar': { height: '3px' },
              '&::-webkit-scrollbar-thumb': { background: '#e2e2e2' },
            }}
          >
            {tabs.map((t, index) => {
              const isActive = index === current;
              return (
                <Button
                  key={t.key}
                  onClick={() => navigate(`/dashboard/${t.key}`)}
                  aria-current={isActive ? 'page' : undefined}
                  flexShrink={0}
                  justifyContent="flex-start"
                  variant="ghost"
                  size="md"
                  borderRadius="0.5rem"
                  fontWeight={isActive ? 600 : 500}
                  color={isActive ? 'white' : 'gray.600'}
                  bgColor={isActive ? ACCENT : 'transparent'}
                  _hover={{
                    bgColor: isActive ? '#bf0055' : 'gray.100',
                    color: isActive ? 'white' : BRAND,
                  }}
                >
                  <HStack spacing={2}>
                    <Box as={t.icon} size={18} />
                    <Text fontSize="0.95rem">{t.label}</Text>
                  </HStack>
                </Button>
              );
            })}
          </Stack>
        </Box>

        <Box
          w="100%"
          minW={0}
          pl={{ base: '1rem', md: '16rem' }}
          pr={{ base: '1rem', md: '2rem' }}
          pt={{ base: '1.5rem', md: '6rem' }}
        >
          {banner}
          <Box mt={banner ? '1rem' : 0}>{active.render()}</Box>
        </Box>
      </Flex>
    </>
  );
}

DashboardShell.propTypes = {
  title: PropTypes.string,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      render: PropTypes.func.isRequired,
    })
  ).isRequired,
  banner: PropTypes.node,
};

DashboardShell.defaultProps = { title: 'Dashboard', banner: null };

export default DashboardShell;
