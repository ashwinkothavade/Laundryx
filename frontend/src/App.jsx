import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import PreLoader from './Animation/PreLoader';
import './App.css';
import CheckoutPage from './pages/CheckoutPage';
import DumyPayment from './pages/DumyPayment';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import OrderConfirmationPage from './pages/OrderConfirmation';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderList from './pages/OrderList';
import Signup from './pages/Signup';
import StudentDashBoard from './pages/DashBoard/Student';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 4000);
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage />}
        // element={isLoading ? <PreLoader /> : <LandingPage />}
      />
      <Route
        path="/OrderList"
        element={<OrderList />}
        // element={isLoading ? <PreLoader /> : <OrderList />}
      />
      <Route
        path="/CheckoutPage"
        element={<CheckoutPage />}
        // element={isLoading ? <PreLoader /> : <CheckoutPage />}
      />
      <Route
        path="/OrderConfirmationPage"
        element={<OrderConfirmationPage />}
        // element={isLoading ? <PreLoader /> : <OrderConfirmationPage />}
      />
      <Route
        path="/OrderHistoryPage"
        element={<OrderHistoryPage />}
        // element={isLoading ? <PreLoader /> : <OrderHistoryPage />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/payment" element={<DumyPayment />} />
      <Route path="/dashboard/student" element={<StudentDashBoard />} />
    </Routes>
  );
}

export default App;
