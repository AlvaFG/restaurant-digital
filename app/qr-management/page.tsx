/**
 * QR Management Admin Page
 * 
 * Admin interface for QR code generation and session monitoring.
 * Combines QRManagementPanel and SessionMonitorDashboard.
 */

import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRManagementPanel } from '@/components/qr-management-panel';
import { SessionMonitorDashboard } from '@/components/session-monitor-dashboard';
import { QrCode, Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'QR Management | Restaurant Admin',
  description: 'Manage QR codes and monitor customer sessions',
};

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
