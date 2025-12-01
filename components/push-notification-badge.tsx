/**
 * Push Notification Badge
 * Shows subscription status and provides quick access to settings
 */

'use client';

import { useState } from 'react';
import { Bell, BellOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import Link from 'next/link';

export function PushNotificationBadge() {
  const { isSupported, permission, isSubscribed } = usePushNotifications();
  const [open, setOpen] = useState(false);

  if (!isSupported) {
    return null;
  }

  const getStatus = () => {
    if (permission === 'denied') return { text: 'Bloqueadas', variant: 'destructive' as const };
    if (!isSubscribed) return { text: 'Inactivas', variant: 'secondary' as const };
    return { text: 'Activas', variant: 'default' as const };
  };

  const status = getStatus();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label="Estado de notificaciones push"
        >
          {isSubscribed ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          <Badge variant={status.variant} className="hidden sm:inline-flex">
            {status.text}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium leading-none mb-2">Notificaciones Push</h4>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'Recibirás notificaciones en tiempo real' 
                : 'Activa las notificaciones para recibir alertas instantáneas'
              }
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Estado actual:</span>
            <Badge variant={status.variant}>{status.text}</Badge>
          </div>

          {permission === 'denied' && (
            <p className="text-xs text-muted-foreground">
              Las notificaciones están bloqueadas en tu navegador. 
              Cambia los permisos en la configuración del sitio.
            </p>
          )}

          <Link href="/configuracion/notificaciones" onClick={() => setOpen(false)}>
            <Button className="w-full" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configurar notificaciones
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
