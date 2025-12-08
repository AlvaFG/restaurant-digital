'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QRValidateContentProps {
  token?: string;
}

export default function QRValidateContent({ token }: QRValidateContentProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No se proporcionó un código QR válido');
      return;
    }

    async function validateToken(token: string) {
      try {
        const response = await fetch('/api/qr/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setStatus('error');
          setError(data.error || 'Código QR inválido o expirado');
          return;
        }

        // Guardar sesión en localStorage
        localStorage.setItem('qr_session', JSON.stringify({
          sessionId: data.sessionId,
          tableId: data.tableId,
          table: data.table,
          expiresAt: data.session.expiresAt,
        }));

        setStatus('success');

        // Redirigir al menú después de 1 segundo
        setTimeout(() => {
          router.push(`/qr/${data.tableId}`);
        }, 1000);
      } catch (err) {
        setStatus('error');
        setError('Error al validar el código QR. Por favor, inténtalo de nuevo.');
        // Log error for debugging (public route)
        if (process.env.NODE_ENV === 'development') {
          console.error('QR validation error:', err);
        }
      }
    }

    validateToken(token);
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {status === 'validating' && (
            <div className="text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Validando código QR
              </h2>
              <p className="text-gray-600">
                Por favor espera mientras verificamos tu mesa...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Código validado!
              </h2>
              <p className="text-gray-600">
                Redirigiendo al menú...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Error de validación
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Intentar de nuevo
                </button>
                <p className="text-sm text-gray-500">
                  Si el problema persiste, solicita un nuevo código QR al personal del restaurante.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
