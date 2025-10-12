/**
 * QR Management Panel Component
 * 
 * Admin interface for managing QR codes for tables.
 * Features:
 * - Single QR generation
 * - Bulk QR generation
 * - QR preview and download
 * - Session monitoring
 * - QR regeneration
 * 
 * @component QRManagementPanel
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, RefreshCw, Grid3x3, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Table {
  id: string;
  number: number;
  zone: string;
  seats: number;
}

interface GeneratedQR {
  tableId: string;
  tableNumber: number;
  zone: string;
  token: string;
  qrCodeDataURL: string;
  expiresAt: string;
  generatedAt: string;
}

interface QRGenerationResult {
  success: boolean;
  data?: GeneratedQR;
  error?: string;
}

interface BulkGenerationResult {
  success: boolean;
  data?: {
    generated: GeneratedQR[];
    total: number;
    failed: number;
  };
  error?: string;
}

export function QRManagementPanel() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [generatedQR, setGeneratedQR] = useState<GeneratedQR | null>(null);
  const [bulkQRs, setBulkQRs] = useState<GeneratedQR[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    }
  };

  const generateSingleQR = async () => {
    if (!selectedTable) {
      setError('Please select a table');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: selectedTable }),
      });

      const result: QRGenerationResult = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate QR code');
      }

      setGeneratedQR(result.data);
      setSuccess(`QR code generated successfully for Table ${result.data.tableNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const generateBulkQRs = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const tableIds = tables.map(t => t.id);
      
      const response = await fetch('/api/qr/generate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableIds }),
      });

      const result: BulkGenerationResult = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate QR codes');
      }

      setBulkQRs(result.data.generated);
      setSuccess(
        `Successfully generated ${result.data.total} QR codes` +
        (result.data.failed > 0 ? ` (${result.data.failed} failed)` : '')
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (qr: GeneratedQR) => {
    const link = document.createElement('a');
    link.href = qr.qrCodeDataURL;
    link.download = `table-${qr.tableNumber}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllQRs = () => {
    bulkQRs.forEach(qr => {
      setTimeout(() => downloadQR(qr), 100);
    });
  };

  const selectedTableData = tables.find(t => t.id === selectedTable);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">QR Code Management</h2>
        <p className="text-muted-foreground">
          Generate and manage QR codes for table ordering
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single QR</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
        </TabsList>

        {/* Single QR Generation */}
        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Single QR Code</CardTitle>
              <CardDescription>
                Create a QR code for a specific table
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="table-select">Select Table</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger id="table-select">
                    <SelectValue placeholder="Choose a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map(table => (
                      <SelectItem key={table.id} value={table.id}>
                        Table {table.number} - {table.zone} ({table.seats} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTableData && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{selectedTableData.zone}</Badge>
                  <span>•</span>
                  <span>{selectedTableData.seats} seats</span>
                </div>
              )}

              <Button
                onClick={generateSingleQR}
                disabled={loading || !selectedTable}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* QR Preview */}
          {generatedQR && (
            <Card>
              <CardHeader>
                <CardTitle>Generated QR Code</CardTitle>
                <CardDescription>
                  Table {generatedQR.tableNumber} - {generatedQR.zone}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className="border rounded-lg p-4 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedQR.qrCodeDataURL}
                      alt={`QR Code for Table ${generatedQR.tableNumber}`}
                      className="w-64 h-64"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Table Number</p>
                    <p className="font-medium">{generatedQR.tableNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Zone</p>
                    <p className="font-medium">{generatedQR.zone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Generated At</p>
                    <p className="font-medium">
                      {new Date(generatedQR.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires At</p>
                    <p className="font-medium">
                      {new Date(generatedQR.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadQR(generatedQR)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                  </Button>
                  <Button
                    onClick={generateSingleQR}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bulk QR Generation */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk QR Generation</CardTitle>
              <CardDescription>
                Generate QR codes for all tables at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total Tables</p>
                    <p className="text-2xl font-bold">{tables.length}</p>
                  </div>
                  <Grid3x3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>

              <Button
                onClick={generateBulkQRs}
                disabled={loading || tables.length === 0}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating {tables.length} QR Codes...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate All QR Codes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Bulk Results */}
          {bulkQRs.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated QR Codes</CardTitle>
                    <CardDescription>
                      {bulkQRs.length} QR codes ready for download
                    </CardDescription>
                  </div>
                  <Button onClick={downloadAllQRs} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bulkQRs.map(qr => (
                    <div
                      key={qr.tableId}
                      className="border rounded-lg p-3 space-y-2 hover:border-primary transition-colors"
                    >
                      <div className="flex justify-center bg-white rounded p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qr.qrCodeDataURL}
                          alt={`Table ${qr.tableNumber}`}
                          className="w-32 h-32"
                        />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-medium">Table {qr.tableNumber}</p>
                        <p className="text-xs text-muted-foreground">{qr.zone}</p>
                      </div>
                      <Button
                        onClick={() => downloadQR(qr)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
