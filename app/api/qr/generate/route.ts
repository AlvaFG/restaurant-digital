/**
 * QR Generate API
 * POST /api/qr/generate
 * Genera un código QR para una mesa específica (requiere autenticación de staff)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateQRCode } from '@/lib/server/qr-service';
import { getTableById, updateTableQR } from '@/lib/server/table-store';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // TODO: Agregar autenticación de staff cuando esté implementada
    // const session = await getSession(request);
    // if (!session || session.user.role !== 'staff') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { tableId } = body;

    if (!tableId) {
      return NextResponse.json(
        { error: 'tableId is required' },
        { status: 400 }
      );
    }

    // Verificar que la mesa existe
    const table = await getTableById(tableId);
    if (!table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Generar QR code
    const result = await generateQRCode(tableId);

    // Guardar token en la mesa
    await updateTableQR(tableId, result.token, result.expiresAt);

    logger.info('QR code generated for table', {
      tableId,
      expiresAt: result.expiresAt,
    });

    return NextResponse.json({
      qrCode: result.qrCode,
      url: result.url,
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
      table: {
        id: table.id,
        number: table.number,
        zone: table.zone,
      },
    });
  } catch (error) {
    logger.error('Failed to generate QR code', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
