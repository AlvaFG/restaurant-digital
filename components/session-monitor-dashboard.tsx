/**
 * Session Monitor Dashboard Component
 * 
 * Real-time monitoring of active QR sessions.
 * Features:
 * - Live session list with status
 * - Session statistics
 * - Session management (close, extend)
 * - Auto-refresh
 * - Filter by table/status
 * 
 * @component SessionMonitorDashboard
 * @version 1.0.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Clock, 
  ShoppingCart, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  TrendingUp
} from 'lucide-react';
import { logger } from '@/lib/logger';

type SessionStatus = 
  | 'pending' 
  | 'browsing' 
  | 'cart_active' 
  | 'order_placed' 
  | 'awaiting_payment' 
  | 'payment_completed' 
  | 'closed' 
  | 'expired';

interface QRSession {
  id: string;
  tableId: string;
  tableNumber: number;
  zone: string;
  status: SessionStatus;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  cartItemsCount: number;
  orderIds: string[];
  ipAddress?: string;
}

interface SessionStatistics {
  totalActive: number;
  byStatus: Record<SessionStatus, number>;
  byTable: Record<string, number>;
  averageDuration: number;
  todayTotal: number;
  timestamp: string;
}

const STATUS_COLORS: Record<SessionStatus, string> = {
  pending: 'bg-gray-500',
  browsing: 'bg-blue-500',
  cart_active: 'bg-yellow-500',
  order_placed: 'bg-orange-500',
  awaiting_payment: 'bg-purple-500',
  payment_completed: 'bg-green-500',
  closed: 'bg-gray-400',
  expired: 'bg-red-500',
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  pending: 'Pending',
  browsing: 'Browsing',
  cart_active: 'Cart Active',
  order_placed: 'Order Placed',
  awaiting_payment: 'Awaiting Payment',
  payment_completed: 'Payment Done',
  closed: 'Closed',
  expired: 'Expired',
};

export function SessionMonitorDashboard() {
  const [sessions, setSessions] = useState<QRSession[]>([]);
  const [statistics, setStatistics] = useState<SessionStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');

  const fetchSessions = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      setLoading(true);
      
      logger.debug('Obteniendo sesiones activas');
      
      // Fetch sessions
      const sessionsResponse = await fetch('/api/sessions');
      const sessionsData = await sessionsResponse.json();
      setSessions(sessionsData.sessions || []);

      // Fetch statistics
      const statsResponse = await fetch('/api/sessions/statistics');
      const statsData = await statsResponse.json();
      setStatistics(statsData.statistics || null);
      
      const duration = Date.now() - startTime;
      logger.info('Sesiones obtenidas exitosamente', { 
        count: sessionsData.sessions?.length || 0,
        duration: `${duration}ms`
      });
    } catch (error) {
      logger.error('Error al obtener sesiones', error as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchSessions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchSessions]);

  const closeSession = async (sessionId: string) => {
    try {
      logger.info('Cerrando sesión manualmente', { sessionId });
      
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      
      logger.info('Sesión cerrada exitosamente', { sessionId });
      fetchSessions();
    } catch (error) {
      logger.error('Error al cerrar sesión', error as Error, { sessionId });
    }
  };

  const extendSession = async (sessionId: string) => {
    try {
      logger.info('Extendiendo sesión', { sessionId });
      
      await fetch(`/api/sessions/${sessionId}/extend`, {
        method: 'POST',
      });
      
      logger.info('Sesión extendida exitosamente', { sessionId });
      fetchSessions();
    } catch (error) {
      logger.error('Error al extender sesión', error as Error, { sessionId });
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.tableNumber.toString().includes(searchQuery) ||
      session.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getTimeRemaining = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const getSessionDuration = (createdAt: string) => {
    const duration = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(duration / 60000);
    
    return `${minutes} min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Session Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of active QR sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Auto-refresh ON
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Auto-refresh OFF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalActive}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Cart</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.byStatus.cart_active || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Items in cart
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(statistics.averageDuration / 60)} min
              </div>
              <p className="text-xs text-muted-foreground">
                Average session time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.todayTotal}</div>
              <p className="text-xs text-muted-foreground">
                Sessions created today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by table, zone, or session ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SessionStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="browsing">Browsing</SelectItem>
                <SelectItem value="cart_active">Cart Active</SelectItem>
                <SelectItem value="order_placed">Order Placed</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <p>No active sessions found</p>
                </div>
              ) : (
                filteredSessions.map(session => (
                  <Card key={session.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">Table {session.tableNumber}</h4>
                            <Badge variant="outline" className="text-xs">
                              {session.zone}
                            </Badge>
                            <Badge className={`${STATUS_COLORS[session.status]} text-xs`}>
                              {STATUS_LABELS[session.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>Duration: {getSessionDuration(session.createdAt)}</span>
                            <span>•</span>
                            <span>Expires: {getTimeRemaining(session.expiresAt)}</span>
                            {session.cartItemsCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <ShoppingCart className="h-3 w-3" />
                                  {session.cartItemsCount} items
                                </span>
                              </>
                            )}
                            {session.orderIds.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {session.orderIds.length} order{session.orderIds.length !== 1 ? 's' : ''}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            {session.id}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => extendSession(session.id)}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closeSession(session.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
