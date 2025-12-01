/**
 * Sync Operation Types
 * Defines all possible sync operations
 */

// Operation types
export type SyncOperationType =
  | 'CREATE_ORDER'
  | 'UPDATE_ORDER'
  | 'UPDATE_ORDER_STATUS'
  | 'DELETE_ORDER'
  | 'UPDATE_TABLE_STATUS'
  | 'CREATE_PAYMENT'
  | 'UPDATE_MENU_ITEM'
  | 'BATCH_OPERATION';

export type SyncEntityType = 'order' | 'table' | 'payment' | 'menu';

export type SyncStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Operation payloads
export interface CreateOrderPayload {
  tableId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
  total: number;
  notes?: string;
}

export interface UpdateOrderPayload {
  orderId: string;
  updates: {
    status?: string;
    items?: any[];
    total?: number;
    notes?: string;
  };
}

export interface UpdateTableStatusPayload {
  tableId: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrderId?: string;
}

export interface CreatePaymentPayload {
  orderId: string;
  amount: number;
  method: 'cash' | 'card' | 'mercadopago' | 'transfer';
  status: 'pending' | 'completed' | 'failed';
}

export interface UpdateMenuItemPayload {
  menuItemId: string;
  updates: {
    available?: boolean;
    price?: number;
    description?: string;
  };
}

export interface BatchOperationPayload {
  operations: Array<{
    type: SyncOperationType;
    payload: any;
  }>;
}

// Operation metadata
export interface SyncOperationMetadata {
  operationId: string;
  type: SyncOperationType;
  entityType: SyncEntityType;
  entityId: string;
  payload: any;
  status: SyncStatus;
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  userId?: string;
  tenantId?: string;
}

/**
 * Operation priority levels
 */
export enum SyncPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Get priority for operation type
 */
export function getOperationPriority(type: SyncOperationType): SyncPriority {
  switch (type) {
    case 'CREATE_PAYMENT':
    case 'UPDATE_ORDER_STATUS':
      return SyncPriority.CRITICAL;
    
    case 'CREATE_ORDER':
    case 'UPDATE_TABLE_STATUS':
      return SyncPriority.HIGH;
    
    case 'UPDATE_ORDER':
      return SyncPriority.NORMAL;
    
    default:
      return SyncPriority.LOW;
  }
}

/**
 * Check if operation should be retried
 */
export function shouldRetryOperation(
  retryCount: number,
  maxRetries: number,
  lastError?: string
): boolean {
  // Don't retry validation errors
  if (lastError?.includes('validation') || lastError?.includes('invalid')) {
    return false;
  }
  
  // Don't retry authorization errors
  if (lastError?.includes('unauthorized') || lastError?.includes('forbidden')) {
    return false;
  }
  
  return retryCount < maxRetries;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function getRetryDelay(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, ...
  const baseDelay = 1000;
  const maxDelay = 60000; // Max 1 minute
  
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 1000;
  
  return delay + jitter;
}

/**
 * Validate operation payload
 */
export function validateOperationPayload(
  type: SyncOperationType,
  payload: any
): { valid: boolean; error?: string } {
  try {
    switch (type) {
      case 'CREATE_ORDER':
        if (!payload.tableId || !payload.items || !Array.isArray(payload.items)) {
          return { valid: false, error: 'Invalid CREATE_ORDER payload' };
        }
        break;
      
      case 'UPDATE_TABLE_STATUS':
        if (!payload.tableId || !payload.status) {
          return { valid: false, error: 'Invalid UPDATE_TABLE_STATUS payload' };
        }
        break;
      
      case 'CREATE_PAYMENT':
        if (!payload.orderId || !payload.amount || !payload.method) {
          return { valid: false, error: 'Invalid CREATE_PAYMENT payload' };
        }
        break;
      
      // Add more validations as needed
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Payload validation failed' };
  }
}
