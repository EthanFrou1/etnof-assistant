import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AgendaPage } from '@/pages/AgendaPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { StaffPage } from '@/pages/StaffPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AssistantPage } from '@/pages/AssistantPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'agenda', element: <AgendaPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'staff', element: <StaffPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'assistant', element: <AssistantPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
