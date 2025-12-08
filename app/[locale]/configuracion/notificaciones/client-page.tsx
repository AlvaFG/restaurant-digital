'use client';

import { NotificationPreferences } from '@/components/notification-preferences';

export default function NotificationPreferencesPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Notificaciones Push</h1>
        <p className="text-muted-foreground mt-2">
          Configura cómo y cuándo quieres recibir notificaciones en tiempo real
        </p>
      </div>

      <NotificationPreferences />
    </div>
  );
}
