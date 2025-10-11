import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
      return NextResponse.json(
        { error: 'Mesa no encontrada' },
        { status: 404 }
      );
    }

    // Check if QR has expired (if expiration date is set)
    if (table.qr_expires_at) {
      const expirationDate = new Date(table.qr_expires_at);
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { error: 'El código QR ha expirado' },
          { status: 410 } // Gone
        );
      }
    }

    // Transform to match expected format
    const tableResponse = {
      id: table.id,
      number: table.number,
      zone: table.zone,
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
    console.error('[api/tables/by-token] Error:', error);
    return NextResponse.json(
      { error: 'Error al buscar la mesa' },
      { status: 500 }
    );
  }
}
