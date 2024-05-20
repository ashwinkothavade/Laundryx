import React, { useEffect, useState } from 'react';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import OrderList from './pages/OrderList';
import PreLoader from './components/PreLoader';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmation';
import OrderHistoryPage from './pages/OrderHistoryPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DumyPayment from './pages/DumyPayment';
import Cookies from 'universal-cookie';
import useOrderStore from './components/Store/OrderStore';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const cookies = new Cookies();

  const { addAuth, setUserName, setUserEmail, setUserPhone } = useOrderStore(
    (state) => ({
      addAuth: state.addAuth,
      setUserName: state.setUserName,
      setUserEmail: state.setUserEmail,
      setUserPhone: state.setUserPhone,
    })
  );

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    if (cookies.get('token')) {
      addAuth();
      setUserName(cookies.get('userName'));
      setUserEmail(cookies.get('userEmail'));
      setUserPhone(cookies.get('userPhone'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={isLoading ? <PreLoader /> : <LandingPage />} />
        <Route
          path="/OrderList"
          element={isLoading ? <PreLoader /> : <OrderList />}
        />
        <Route
          path="/CheckoutPage"
          element={isLoading ? <PreLoader /> : <CheckoutPage />}
        />
        <Route
          path="/OrderConfirmationPage"
          element={isLoading ? <PreLoader /> : <OrderConfirmationPage />}
        />
        <Route
          path="/OrderHistoryPage"
          element={isLoading ? <PreLoader /> : <OrderHistoryPage />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/payment" element={<DumyPayment />} />
      </Routes>
    </>
  );
}

export default App;
