/**
 * Hook personalizado para gestionar el estado de pagos
 * Features:
 * - createPayment: Crea un nuevo pago para un pedido
 * - getPaymentStatus: Obtiene el estado actual de un pago
 * - WebSocket listener para actualizaciones en tiempo real
 * - Estado de loading y errores
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './use-socket';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  provider: string;
  externalId?: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsePaymentReturn {
  createPayment: (orderId: string, amount: number) => Promise<Payment | null>;
  getPaymentStatus: (paymentId: string) => Promise<Payment | null>;
  payment: Payment | null;
  isLoading: boolean;
  error: string | null;
}

export function usePayment(): UsePaymentReturn {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  // Escuchar actualizaciones de pago en tiempo real
  useEffect(() => {
    if (!socket) return;

    const handlePaymentUpdate = (data: Payment) => {
      if (payment && data.id === payment.id) {
        setPayment(data);
      }
    };

    socket.on('payment:updated', handlePaymentUpdate);

    return () => {
      socket.off('payment:updated', handlePaymentUpdate);
    };
  }, [socket, payment]);

  const createPayment = useCallback(async (orderId: string, amount: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el pago');
      }

      const newPayment = await response.json();
      setPayment(newPayment);
      return newPayment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPaymentStatus = useCallback(async (paymentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payment/${paymentId}`);

      if (!response.ok) {
        throw new Error('Error al obtener el estado del pago');
      }

      const paymentData = await response.json();
      setPayment(paymentData);
      return paymentData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createPayment,
    getPaymentStatus,
    payment,
    isLoading,
    error,
  };
}
