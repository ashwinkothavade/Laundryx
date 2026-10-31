import PropTypes from 'prop-types';
import { Center, Spinner } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './Store/AuthStore';
import { getMe } from '../utils/apis';

// Gate for the signed-in half of the app.
//
// Every route used to be public. The dashboard picked which panel to show
// from `userRole` in sessionStorage, which the user can edit, so a signed-out
// visitor reached a dashboard where every request then failed one by one.
// The API always refused them — this was never a privilege hole — but the
// page was broken rather than honest about why.
//
// sessionStorage is a cache of the last known session, not proof of one, so
// this confirms against /me before rendering. The cookie is httpOnly and
// cannot be read from JS; asking the server is the only real check.
function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const { isAuth, userRole, addAuth, removeAuth, setUserRole } = useAuthStore(
    (state) => ({
      isAuth: state.isAuth,
      userRole: state.userRole,
      addAuth: state.addAuth,
      removeAuth: state.removeAuth,
      setUserRole: state.setUserRole,
    })
  );

  // 'checking' until /me answers, so we never flash the login screen at
  // someone who is in fact signed in.
  const [status, setStatus] = useState(isAuth ? 'checking' : 'anonymous');

  useEffect(() => {
    let cancelled = false;
    if (!isAuth) {
      setStatus('anonymous');
      return undefined;
    }
    getMe()
      .then((res) => {
        if (cancelled) return;
        addAuth();
        setUserRole(res.data.role);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        removeAuth();
        setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuth, addAuth, removeAuth, setUserRole]);

  if (status === 'checking') {
    return (
      <Center h="100vh">
        <Spinner size="xl" thickness="3px" color="#584BAC" />
      </Center>
    );
  }

  if (status === 'anonymous') {
    // Remember where they were headed so login can return them there.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length && !roles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string),
};

ProtectedRoute.defaultProps = {
  roles: null,
};

export default ProtectedRoute;
