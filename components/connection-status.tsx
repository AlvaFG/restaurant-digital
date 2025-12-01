/**
 * Connection Status Component
 * Shows a visual indicator of network connectivity
 */

'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { AlertCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const { isOnline, status } = useOnlineStatus();

  // Don't show anything when online and stable
  if (status === 'online') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium shadow-lg',
          status === 'offline' && 'bg-destructive text-destructive-foreground',
          status === 'syncing' && 'bg-yellow-500 text-yellow-950'
        )}
      >
        {status === 'offline' && (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Sin conexión - Los cambios se sincronizarán automáticamente</span>
          </>
        )}
        
        {status === 'syncing' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sincronizando cambios...</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact connection indicator (for headers/nav)
 */
export function ConnectionIndicator() {
  const { status } = useOnlineStatus();

  if (status === 'online') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span className="hidden sm:inline">Conectado</span>
      </div>
    );
  }

  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="hidden sm:inline">Sincronizando</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-destructive">
      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
      <span className="hidden sm:inline">Sin conexión</span>
    </div>
  );
}

/**
 * Detailed connection status card
 */
export function ConnectionStatusCard() {
  const { isOnline, status, lastOnline, lastOffline } = useOnlineStatus();

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {status === 'online' && <Wifi className="h-5 w-5 text-green-500" />}
            {status === 'syncing' && <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />}
            {status === 'offline' && <WifiOff className="h-5 w-5 text-destructive" />}
            
            <h3 className="font-semibold">
              {status === 'online' && 'Conectado'}
              {status === 'syncing' && 'Sincronizando'}
              {status === 'offline' && 'Sin Conexión'}
            </h3>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {status === 'online' && 'Todas las funciones están disponibles'}
            {status === 'syncing' && 'Sincronizando cambios pendientes...'}
            {status === 'offline' && 'Modo offline activado - Los cambios se guardarán localmente'}
          </p>
        </div>

        <div
          className={cn(
            'h-3 w-3 rounded-full',
            status === 'online' && 'bg-green-500',
            status === 'syncing' && 'bg-yellow-500 animate-pulse',
            status === 'offline' && 'bg-destructive animate-pulse'
          )}
        />
      </div>

      {(lastOnline || lastOffline) && (
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          {lastOnline && (
            <div>Última conexión: {lastOnline.toLocaleTimeString()}</div>
          )}
          {lastOffline && (
            <div>Desconectado desde: {lastOffline.toLocaleTimeString()}</div>
          )}
        </div>
      )}
    </div>
  );
}
