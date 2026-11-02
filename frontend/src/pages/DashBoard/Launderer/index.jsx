import { Alert, AlertIcon, Stack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FiBarChart2, FiBox, FiList } from 'react-icons/fi';
import { RiAccountBoxLine } from 'react-icons/ri';
import DashboardShell from '../../../components/DashboardShell';
import LaundererAnalytics from '../../../components/LaundererAnalytics';
import LaundererAvailability from '../../../components/LaundererAvailability';
import LaundererCatalog from '../../../components/LaundererCatalog';
import LaundererDetails from '../../../components/LaundererDetails';
import LaundererOrdersDetail from '../../../components/LaundererOrdersDetail';
import { getMe } from '../../../utils/apis';

// A launderer signs in to find out how the business is doing, so the overview
// is the landing section rather than the last tab in the list.
const TABS = [
  {
    key: 'overview',
    label: 'Overview',
    icon: FiBarChart2,
    render: () => <LaundererAnalytics />,
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: FiBox,
    render: () => <LaundererOrdersDetail />,
  },
  {
    key: 'catalog',
    label: 'Catalog',
    icon: FiList,
    render: () => (
      <Stack w="100%" align="center" gap={8}>
        <LaundererAvailability />
        <LaundererCatalog />
      </Stack>
    ),
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: RiAccountBoxLine,
    render: () => <LaundererDetails />,
  },
];

function LaundererDashboard() {
  const [approved, setApproved] = useState(null);

  useEffect(() => {
    let live = true;
    getMe()
      .then((res) => {
        if (live) setApproved(res.data.approved);
      })
      .catch(() => {
        if (live) setApproved(null);
      });
    return () => {
      live = false;
    };
  }, []);

  const banner =
    approved === false ? (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        Your launderer account is pending admin approval. You can set up your
        catalog now, but students won’t see you or be able to place orders until
        you’re approved.
      </Alert>
    ) : null;

  return <DashboardShell title="Your laundry" tabs={TABS} banner={banner} />;
}

export default LaundererDashboard;
