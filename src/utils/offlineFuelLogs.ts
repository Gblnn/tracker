import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase";

export interface PendingFuelLog {
  id: string;
  data: {
    date: string;
    odometer_reading: number;
    amount_spent: number;
    vehicle_number: string;
    email: string;
    employee_name: string;
    employee_code: string;
    timestamp: number;
  };
  createdAt: number;
  retryCount: number;
}

const STORAGE_KEY = "pending_fuel_logs";

// Get all pending fuel logs from localStorage
export function getPendingFuelLogs(): PendingFuelLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading pending fuel logs:", error);
    return [];
  }
}

// Save pending fuel logs to localStorage
function savePendingFuelLogs(logs: PendingFuelLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error saving pending fuel logs:", error);
  }
}

// Add a new pending fuel log
export function addPendingFuelLog(logData: PendingFuelLog["data"]): string {
  const logs = getPendingFuelLogs();
  const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newLog: PendingFuelLog = {
    id,
    data: logData,
    createdAt: Date.now(),
    retryCount: 0,
  };
  
  logs.push(newLog);
  savePendingFuelLogs(logs);
  
  return id;
}

// Remove a pending fuel log by ID
export function removePendingFuelLog(id: string): void {
  const logs = getPendingFuelLogs();
  const filtered = logs.filter(log => log.id !== id);
  savePendingFuelLogs(filtered);
}

// Update retry count for a pending log
export function incrementRetryCount(id: string): void {
  const logs = getPendingFuelLogs();
  const updated = logs.map(log => 
    log.id === id ? { ...log, retryCount: log.retryCount + 1 } : log
  );
  savePendingFuelLogs(updated);
}

// Sync a single pending fuel log to Firestore
export async function syncPendingFuelLog(log: PendingFuelLog): Promise<void> {
  try {
    await addDoc(collection(db, "fuel log"), {
      ...log.data,
      created_at: new Date(),
    });
    removePendingFuelLog(log.id);
  } catch (error) {
    incrementRetryCount(log.id);
    throw error;
  }
}

// Sync all pending fuel logs
export async function syncAllPendingFuelLogs(
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const logs = getPendingFuelLogs();
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < logs.length; i++) {
    try {
      await syncPendingFuelLog(logs[i]);
      success++;
    } catch (error) {
      console.error(`Failed to sync fuel log ${logs[i].id}:`, error);
      failed++;
    }
    
    if (onProgress) {
      onProgress(i + 1, logs.length);
    }
  }
  
  return { success, failed };
}

// Check if there are pending logs
export function hasPendingFuelLogs(): boolean {
  return getPendingFuelLogs().length > 0;
}

// Get count of pending logs
export function getPendingFuelLogsCount(): number {
  return getPendingFuelLogs().length;
}
