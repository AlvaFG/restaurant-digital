/**
 * Sync Status Panel
 * Shows the status of pending sync operations
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Database,
  Loader2
} from 'lucide-react';
import { 
  getSyncQueueStats,
  triggerManualSync,
  retryFailedOperations,
} from '@/lib/sync';

export function SyncStatusPanel() {
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Load stats
  const loadStats = async () => {
    try {
      const newStats = await getSyncQueueStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle manual sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await triggerManualSync();
      setLastSync(new Date());
      await loadStats();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle retry failed
  const handleRetryFailed = async () => {
    try {
      await retryFailedOperations();
      await loadStats();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const completionRate = stats.total > 0
    ? Math.round(((stats.completed / stats.total) * 100))
    : 100;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Estado de Sincronización</h3>
          </div>
          
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            size="sm"
            variant="outline"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar Ahora
              </>
            )}
          </Button>
        </div>

        {/* Progress */}
        {stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso</span>
              <span className="text-muted-foreground">{completionRate}%</span>
            </div>
            <Progress value={completionRate} />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Pendientes</span>
            </div>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4" />
              <span>Procesando</span>
            </div>
            <div className="text-2xl font-bold">{stats.processing}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Completadas</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>Fallidas</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          </div>
        </div>

        {/* Retry Failed Button */}
        {stats.failed > 0 && (
          <Button
            onClick={handleRetryFailed}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar Operaciones Fallidas ({stats.failed})
          </Button>
        )}

        {/* Last Sync */}
        {lastSync && (
          <div className="text-sm text-muted-foreground">
            Última sincronización: {lastSync.toLocaleTimeString()}
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm">Estado:</span>
          {stats.pending > 0 ? (
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              {stats.pending} pendientes
            </Badge>
          ) : stats.failed > 0 ? (
            <Badge variant="destructive">
              <AlertCircle className="mr-1 h-3 w-3" />
              {stats.failed} fallidas
            </Badge>
          ) : (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Todo sincronizado
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
