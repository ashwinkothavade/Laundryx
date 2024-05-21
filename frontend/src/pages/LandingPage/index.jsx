import React from 'react';
import Home from '../../components/Home';
import Navbar from '../../components/Navbar';
import useOrderStore from '../../components/Store/OrderStore';

function LandingPage() {
  const {isAuth, userName, userRole} = useOrderStore();
  console.log(isAuth, userName, userRole);
  return (
    <>
      <Navbar />
      <Home />
    </>
  );
}

export default LandingPage;
