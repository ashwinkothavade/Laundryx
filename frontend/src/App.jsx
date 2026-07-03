import React, { Suspense, useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import PreLoader from './Animation/PreLoader';
import useAuthStore from './components/Store/AuthStore';

// Route-level code splitting — each page becomes its own chunk that loads on
// demand, shrinking the initial bundle.
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const LaundererDashboard = React.lazy(
  () => import('./pages/DashBoard/Launderer')
);
const StudentDashBoard = React.lazy(() => import('./pages/DashBoard/Student'));
const AdminDashboard = React.lazy(() => import('./pages/DashBoard/Admin'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const Login = React.lazy(() => import('./pages/Login'));
const OrderList = React.lazy(() => import('./pages/OrderList'));
const Signup = React.lazy(() => import('./pages/Signup'));

function App() {
  // Show the intro preloader only once per browser session, not on every visit.
  const [isLoading, setIsLoading] = useState(
    () => !sessionStorage.getItem('preloaded')
  );
  const { userRole } = useAuthStore((state) => ({
    userRole: state.userRole,
  }));
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('preloaded', 'true');
    }, 4000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <Suspense fallback={<PreLoader />}>
      <Routes>
        <Route path="/" element={isLoading ? <PreLoader /> : <LandingPage />} />
        <Route path="/OrderList" element={<OrderList />} />
        <Route path="/CheckoutPage" element={<CheckoutPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={(() => {
            if (userRole === 'admin') return <AdminDashboard />;
            if (userRole === 'launderer') return <LaundererDashboard />;
            return <StudentDashBoard />;
          })()}
        />
      </Routes>
    </Suspense>
  );
}

export default App;
