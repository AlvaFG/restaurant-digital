/**
 * Notifications Configuration Page
 * Manage push notification settings and preferences
 */

import { Metadata } from 'next';
import NotificationPreferencesPage from './client-page';

export const metadata: Metadata = {
  title: 'Configuración de Notificaciones | Restaurant Management',
  description: 'Gestiona tus preferencias de notificaciones push',
};

// Disable static generation for this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function NotificationsConfigPage() {
  return <NotificationPreferencesPage />;
}
