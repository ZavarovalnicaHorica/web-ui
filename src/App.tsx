import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { Layout } from './components/Layout';
import { HomeRedirect, RequireRole } from './components/RequireRole';
import { MyClaimDetail } from './pages/customer/MyClaimDetail';
import { MyClaims } from './pages/customer/MyClaims';
import { MyPolicies } from './pages/customer/MyPolicies';
import { NewClaim } from './pages/customer/NewClaim';
import { DocumentView } from './pages/DocumentView';
import { Login } from './pages/Login';
import { AuditLog } from './pages/staff/AuditLog';
import { ClaimDetail } from './pages/staff/ClaimDetail';
import { Claims } from './pages/staff/Claims';
import { Dashboard } from './pages/staff/Dashboard';
import { MyReviews } from './pages/staff/MyReviews';
import { EmployeeDetail, Team } from './pages/staff/Team';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: 'login', element: <Login /> },

      // Customer view
      {
        element: <RequireRole roles={['CUSTOMER']} />,
        children: [
          { path: 'my/claims', element: <MyClaims /> },
          { path: 'my/claims/new', element: <NewClaim /> },
          { path: 'my/claims/:id', element: <MyClaimDetail /> },
          { path: 'my/policies', element: <MyPolicies /> },
        ],
      },

      // Employee view
      {
        element: <RequireRole roles={['EMPLOYEE', 'MANAGER']} />,
        children: [
          { path: 'reviews', element: <MyReviews /> },
          { path: 'claims', element: <Claims /> },
          { path: 'claims/:id', element: <ClaimDetail /> },
        ],
      },

      // Manager only
      {
        element: <RequireRole roles={['MANAGER']} />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'team', element: <Team /> },
          { path: 'team/:id', element: <EmployeeDetail /> },
          { path: 'history', element: <AuditLog /> },
        ],
      },

      // Everyone signed in (the API only returns documents of claims the user may see)
      {
        element: <RequireRole roles={['CUSTOMER', 'EMPLOYEE', 'MANAGER']} />,
        children: [{ path: 'documents/:claimId', element: <DocumentView /> }],
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
