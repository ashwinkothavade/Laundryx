import React, { Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PreLoader from './Animation/PreLoader';
import ProtectedRoute from './components/ProtectedRoute';
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
const Signup = React.lazy(() => import('./pages/Signup'));

function App() {
  // Intro animation, once per browser session. Deliberately short: this sits
  // in front of the landing page, which is also where login lands you, so
  // every second here is a second the app feels slow for no reason.
  const INTRO_MS = 1200;
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('preloaded');
    } catch (e) {
      return false;
    }
  });
  const { userRole } = useAuthStore((state) => ({
    userRole: state.userRole,
  }));
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => {
      setIsLoading(false);
      try {
        sessionStorage.setItem('preloaded', 'true');
      } catch (e) {
        // storage blocked; the intro just plays again next time
      }
    }, INTRO_MS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  let dashboardElement = <StudentDashBoard />;
  if (userRole === 'admin') dashboardElement = <AdminDashboard />;
  else if (userRole === 'launderer') dashboardElement = <LaundererDashboard />;

  return (
    <Suspense fallback={<PreLoader />}>
      <Routes>
        <Route path="/" element={isLoading ? <PreLoader /> : <LandingPage />} />
        {/* Placing an order is a section of the dashboard now, not a page of
            its own. Kept as a redirect so older links still land somewhere. */}
        <Route
          path="/OrderList"
          element={<Navigate to="/dashboard/place-order" replace />}
        />
        <Route
          path="/CheckoutPage"
          element={
            <ProtectedRoute roles={['customer']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* The dashboard section lives in the URL so it can be linked to and
            returned to with the back button. */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute>{dashboardElement}</ProtectedRoute>}
        />
        <Route
          path="/dashboard/:tab"
          element={<ProtectedRoute>{dashboardElement}</ProtectedRoute>}
        />
      </Routes>
    </Suspense>
  );
}

export default App;
