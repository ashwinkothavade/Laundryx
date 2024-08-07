import React from 'react';

import { Helmet } from 'react-helmet-async';
import Home from '../../components/Home';
import Navbar from '../../components/Navbar';

function LandingPage() {
  return (
    <>
      <Helmet>
        <title>LaundriX</title>
        <meta name="description" content="" />
      </Helmet>
      <Navbar />
      <Home />
    </>
  );
}

export default LandingPage;
