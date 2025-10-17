import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-tables-by-token');

export async function GET(
  _request: Request,
  context: { params: { token: string } }
) {
  const { token } = context.params;

  if (!token) {
    return NextResponse.json(
      { error: 'Token QR requerido' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Find table by QR token
    const { data: table, error } = await supabase
      .from('tables')
      .select('*')
      .eq('qr_token', token)
      .single();

    if (error || !table) {
      logger.warn('Mesa no encontrada por token', { token, error: error?.message });
      return NextResponse.json(
        { error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    // Check if QR has expired (if expiration date is set)
    if (table.qr_expires_at) {
      const expirationDate = new Date(table.qr_expires_at);
      if (expirationDate < new Date()) {
        logger.warn('Token QR expirado', { token, expiresAt: table.qr_expires_at });
        return NextResponse.json(
          { error: 'El código QR ha expirado' },
          { status: 410 } // Gone
        );
      }
    }

    logger.info('Mesa encontrada por token', {
      tableId: table.id,
      number: table.number,
      zone_id: table.zone_id
    });

    // Transform to match expected format
    const tableResponse = {
      id: table.id,
      number: table.number,
      zone_id: table.zone_id,
      capacity: table.capacity,
      status: table.status,
      position: table.position,
      qrcode_url: table.qrcode_url,
      qr_token: table.qr_token,
      qr_expires_at: table.qr_expires_at,
      metadata: table.metadata,
      created_at: table.created_at,
      updated_at: table.updated_at,
    };

    return NextResponse.json({
      data: tableResponse,
      metadata: {
        version: 1,
        updatedAt: table.updated_at,
      },
    });
  } catch (error) {
    logger.error('Error al buscar mesa por token', error as Error, { token });
    return NextResponse.json(
      { error: 'Error al buscar la mesa' },
      { status: 500 }
    );
  }
}
