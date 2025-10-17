/**
 * QR Management Admin Page
 * 
 * Admin interface for QR code generation and session monitoring.
 * Combines QRManagementPanel and SessionMonitorDashboard.
 */

"use client"

import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { QrCode, Activity } from 'lucide-react';

const QRManagementPanel = dynamic(
  () => import('@/components/qr-management-panel').then(mod => ({ default: mod.QRManagementPanel })),
  { loading: () => <div className="flex h-[400px] items-center justify-center"><LoadingSpinner /></div> }
);

const SessionMonitorDashboard = dynamic(
  () => import('@/components/session-monitor-dashboard').then(mod => ({ default: mod.SessionMonitorDashboard })),
  { loading: () => <div className="flex h-[400px] items-center justify-center"><LoadingSpinner /></div> }
);

export default function QRManagementPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">QR Code Management</h1>
        <p className="text-muted-foreground mt-2">
          Generate QR codes for tables and monitor active customer sessions
        </p>
      </div>

      <Tabs defaultValue="qr-codes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr-codes" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Codes
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Active Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qr-codes" className="mt-6">
          <QRManagementPanel />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <SessionMonitorDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
