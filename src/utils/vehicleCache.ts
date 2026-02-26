// Vehicle allocation caching utilities
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";

const VEHICLE_CACHE_KEY = "cached_vehicle_data";
const VEHICLE_CACHE_TIMESTAMP_KEY = "cached_vehicle_timestamp";
const CACHE_EXPIRY_HOURS = 24; // Cache valid for 24 hours

export interface VehicleData {
  vehicle_number: string;
  make: string;
  model: string;
  year: string;
  type: string;
  status: string;
  registration_type?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Check if vehicle cache is still valid
export const isVehicleCacheValid = (): boolean => {
  try {
    const timestamp = localStorage.getItem(VEHICLE_CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    return cacheAge < maxAge;
  } catch (e) {
    return false;
  }
};

// Get cached vehicle data
export const getCachedVehicle = (): VehicleData | null => {
  try {
    if (!isVehicleCacheValid()) {
      console.log("Vehicle cache expired");
      return null;
    }

    const cached = localStorage.getItem(VEHICLE_CACHE_KEY);
    if (cached) {
      console.log("⚡ Vehicle loaded from cache");
      return JSON.parse(cached);
    }
    return null;
  } catch (e) {
    console.error("Error reading vehicle cache:", e);
    return null;
  }
};

// Cache vehicle data
export const cacheVehicleData = (data: VehicleData): void => {
  try {
    localStorage.setItem(VEHICLE_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(VEHICLE_CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log("✅ Vehicle data cached");
  } catch (error) {
    console.error("Error caching vehicle data:", error);
  }
};

// Clear vehicle cache
export const clearVehicleCache = (): void => {
  try {
    localStorage.removeItem(VEHICLE_CACHE_KEY);
    localStorage.removeItem(VEHICLE_CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Error clearing vehicle cache:", error);
  }
};

// Fetch and cache vehicle data from Firestore
export const fetchAndCacheVehicle = async (vehicleNumber: string): Promise<VehicleData | null> => {
  try {
    if (!vehicleNumber) {
      clearVehicleCache();
      return null;
    }

    const vehicleQuery = query(
      collection(db, "vehicle_master"),
      where("vehicle_number", "==", vehicleNumber)
    );
    const vehicleSnapshot = await getDocs(vehicleQuery);
    
    if (!vehicleSnapshot.empty) {
      const vehicleDoc = vehicleSnapshot.docs[0];
      const vehicleData = vehicleDoc.data() as VehicleData;
      
      const fullVehicleData: VehicleData = {
        vehicle_number: vehicleData.vehicle_number || '',
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        year: vehicleData.year || '',
        type: vehicleData.type || '',
        status: vehicleData.status || 'Active',
        registration_type: vehicleData.registration_type || 'Private',
        createdAt: vehicleData.createdAt,
        updatedAt: vehicleData.updatedAt,
      };
      
      cacheVehicleData(fullVehicleData);
      return fullVehicleData;
    } else {
      console.log("Vehicle not found in vehicle_master");
      clearVehicleCache();
      return null;
    }
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    throw error;
  }
};
