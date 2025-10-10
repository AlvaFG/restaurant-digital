/**
 * Test Setup Utilities
 * 
 * Utilidades compartidas para setup y teardown de tests
 */

import fs from 'fs/promises';
import path from 'path';
import { vi } from 'vitest';

/**
 * Path to test data directory
 */
export const TEST_DATA_DIR = path.join(process.cwd(), 'data', '__test__');

/**
 * Setup test environment
 * - Creates test data directory
 * - Mocks socket-bus
 */
export async function setupTestEnv(): Promise<void> {
  // Create test data directory
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });

  // Mock socket-bus to prevent "client-side import" errors
  vi.mock('@/lib/server/socket-bus', () => ({
    getSocketBus: vi.fn(() => ({
      publish: vi.fn(),
    })),
    assertServerOnly: vi.fn(),
  }));
}

/**
 * Clean up test environment
 * - Removes all test files
 */
export async function cleanupTestEnv(): Promise<void> {
  try {
    const files = await fs.readdir(TEST_DATA_DIR);
    await Promise.all(
      files.map(file => fs.unlink(path.join(TEST_DATA_DIR, file)))
    );
  } catch {
    // Directory might not exist, ignore
  }
}

/**
 * Create a test store file with initial data
 */
export async function createTestStore<T>(
  filename: string,
  initialData: T
): Promise<string> {
  const filePath = path.join(TEST_DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(initialData, null, 2), 'utf-8');
  return filePath;
}

/**
 * Read test store file
 */
export async function readTestStore<T>(filename: string): Promise<T | null> {
  try {
    const filePath = path.join(TEST_DATA_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Delete test store file
 */
export async function deleteTestStore(filename: string): Promise<void> {
  try {
    const filePath = path.join(TEST_DATA_DIR, filename);
    await fs.unlink(filePath);
  } catch {
    // File might not exist, ignore
  }
}
