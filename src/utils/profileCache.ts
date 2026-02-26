// Profile data caching utilities
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";

const PROFILE_CACHE_KEY = "cached_profile_data";
const PROFILE_CACHE_TIMESTAMP_KEY = "cached_profile_timestamp";
const CACHE_EXPIRY_HOURS = 24; // Cache valid for 24 hours

export interface ProfileData {
  name: string;
  email: string;
  employeeCode: string;
  companyName: string;
  dateofJoin: string;
  contact: string;
  cug: string;
  site: string;
  project: string;
  designation: string;
  salaryBasic: string;
  allowance: string;
  profile: string;
  // Document fields
  civil_number?: string;
  civil_expiry?: string;
  vehicle_number?: string;
  vehicle_expiry?: string;
  passportID?: string;
  passportExpiry?: string;
  medical_completed_on?: string;
  medical_due_on?: string;
  vt_hse_induction?: string;
  allocated_vehicle?: string;  // vehicle number allocated from vehicle_master
}

// Check if profile cache is still valid
export const isProfileCacheValid = (): boolean => {
  try {
    const timestamp = localStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheAge = Date.now() - parseInt(timestamp);
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    
    return cacheAge < maxAge;
  } catch (e) {
    return false;
  }
};

// Get cached profile data
export const getCachedProfile = (): ProfileData | null => {
  try {
    if (!isProfileCacheValid()) {
      console.log("Profile cache expired");
      return null;
    }

    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      console.log("⚡ Profile loaded from cache");
      return JSON.parse(cached);
    }
    return null;
  } catch (e) {
    console.error("Error reading profile cache:", e);
    return null;
  }
};

// Cache profile data
export const cacheProfileData = (data: ProfileData): void => {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log("✅ Profile data cached");
  } catch (error) {
    console.error("Error caching profile data:", error);
  }
};

// Clear profile cache
export const clearProfileCache = (): void => {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
    localStorage.removeItem(PROFILE_CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error("Error clearing profile cache:", error);
  }
};

// Fetch and cache profile data from Firestore
export const fetchAndCacheProfile = async (email: string, allocatedVehicle?: string): Promise<ProfileData | null> => {
  try {
    const docQuery = query(
      collection(db, "records"),
      where("email", "==", email)
    );
    const docSnapshot = await getDocs(docQuery);
    
    if (!docSnapshot.empty) {
      const docData = docSnapshot.docs[0].data();
      
      const profileData: ProfileData = {
        name: docData.name || '',
        email: docData.email || '',
        employeeCode: docData.employeeCode || '',
        companyName: docData.companyName || '',
        dateofJoin: docData.dateofJoin || '',
        contact: docData.contact || '',
        cug: docData.cug || '',
        site: docData.site || '',
        project: docData.project || '',
        designation: docData.designation || '',
        salaryBasic: docData.salaryBasic || '',
        allowance: docData.allowance || '',
        profile: docData.profile || '',
        civil_number: docData.civil_number,
        civil_expiry: docData.civil_expiry,
        vehicle_number: docData.vehicle_number,
        vehicle_expiry: docData.vehicle_expiry,
        passportID: docData.passportID,
        passportExpiry: docData.passportExpiry,
        medical_completed_on: docData.medical_completed_on,
        medical_due_on: docData.medical_due_on,
        vt_hse_induction: docData.vt_hse_induction,
        allocated_vehicle: allocatedVehicle,  // from users collection
      };
      
      cacheProfileData(profileData);
      console.log("✅ Profile data fetched and cached");
      return profileData;
    }
    
    return null;
  } catch (err) {
    console.error("Error fetching profile data:", err);
    return null;
  }
};
