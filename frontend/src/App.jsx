import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Cookies from 'universal-cookie';
import PreLoader from './Animation/PreLoader';
import './App.css';
import useOrderStore from './components/Store/OrderStore';
import CheckoutPage from './pages/CheckoutPage';
import DumyPayment from './pages/DumyPayment';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import OrderConfirmationPage from './pages/OrderConfirmation';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderList from './pages/OrderList';
import Signup from './pages/Signup';

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
  }, []);

  return (
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
  );
}

export default App;
