import { db } from "@/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

const CACHE_KEY = "phonebook_cache";
const CACHE_TIMESTAMP_KEY = "phonebook_cache_timestamp";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface PhonebookRecord {
    id: string;
    name: string;
    email: string;
    contact?: string;
    cug?: number;
    role?: string;
    designation?: string;
}

/**
 * Fetch phonebook data from Firestore
 */
export async function fetchPhonebookData(): Promise<PhonebookRecord[]> {
    try {
        const recordsRef = collection(db, "records");
        const q = query(recordsRef, orderBy("name", "asc"), where("contact", "!=", ""));
        const querySnapshot = await getDocs(q);
        
        const fetchedRecords: PhonebookRecord[] = [];
        querySnapshot.forEach((doc) => {
            fetchedRecords.push({
                id: doc.id,
                ...doc.data() as Omit<PhonebookRecord, "id">
            });
        });
        
        return fetchedRecords;
    } catch (error) {
        console.error("Error fetching phonebook records:", error);
        throw error;
    }
}

/**
 * Save phonebook data to localStorage
 */
export function savePhonebookToCache(records: PhonebookRecord[]): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(records));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
        console.error("Error saving phonebook to cache:", error);
    }
}

/**
 * Get phonebook data from localStorage
 */
export function getPhonebookFromCache(): PhonebookRecord[] | null {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) {
            return null;
        }
        return JSON.parse(cachedData) as PhonebookRecord[];
    } catch (error) {
        console.error("Error reading phonebook from cache:", error);
        return null;
    }
}

/**
 * Check if the cache is stale (older than CACHE_DURATION)
 */
export function isCacheStale(): boolean {
    try {
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        if (!timestamp) {
            return true;
        }
        const cacheAge = Date.now() - parseInt(timestamp);
        return cacheAge > CACHE_DURATION;
    } catch (error) {
        console.error("Error checking cache freshness:", error);
        return true;
    }
}

/**
 * Fetch and cache phonebook data in the background
 * This should be called on app launch
 */
export async function refreshPhonebookCache(
    onStatusUpdate?: (status: "pending" | "in-progress" | "completed" | "error", message?: string) => void
): Promise<void> {
    try {
        onStatusUpdate?.("in-progress", "Fetching phonebook data...");
        const records = await fetchPhonebookData();
        savePhonebookToCache(records);
        onStatusUpdate?.("completed", `Cached ${records.length} contacts`);
        console.log("Phonebook cache refreshed successfully");
    } catch (error) {
        console.error("Error refreshing phonebook cache:", error);
        onStatusUpdate?.("error", "Failed to fetch phonebook data");
        // Don't throw error - we don't want to break app launch
    }
}

/**
 * Get phonebook data - returns cached data immediately if available,
 * and optionally fetches fresh data in the background
 */
export async function getPhonebookData(forceRefresh = false): Promise<PhonebookRecord[]> {
    // Check cache first
    if (!forceRefresh) {
        const cachedData = getPhonebookFromCache();
        if (cachedData && !isCacheStale()) {
            return cachedData;
        }
    }
    
    // Fetch fresh data
    const records = await fetchPhonebookData();
    savePhonebookToCache(records);
    return records;
}

/**
 * Clear the phonebook cache
 */
export function clearPhonebookCache(): void {
    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
        console.error("Error clearing phonebook cache:", error);
    }
}
