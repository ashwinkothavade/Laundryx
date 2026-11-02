import React from 'react';
import { FiBox, FiShoppingBag } from 'react-icons/fi';
import { RiAccountBoxLine } from 'react-icons/ri';
import DashboardShell from '../../../components/DashboardShell';
import OrderCard from '../../../components/OrderCard';
import StudentDetails from '../../../components/StudentDetails';
import OrderDetail from '../../../components/StudentOrdersDetail';

// Placing an order is the reason a student opens LaundriX, so it is the
// section they land on. It used to live on its own route that the dashboard
// never linked to, which meant a signed-in student had no way to reach the
// one thing they came to do without going back to the marketing page.
const TABS = [
  {
    key: 'place-order',
    label: 'Place order',
    icon: FiShoppingBag,
    render: () => <OrderCard />,
  },
  {
    key: 'orders',
    label: 'My orders',
    icon: FiBox,
    render: () => <OrderDetail />,
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: RiAccountBoxLine,
    render: () => <StudentDetails />,
  },
];

function StudentDashBoard() {
  return <DashboardShell title="Your laundry" tabs={TABS} />;
}

export default StudentDashBoard;
