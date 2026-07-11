export interface Punch {
  id: number;
  user_id: string;
  punch_time: string;
  verify_type: number;
  punch_type: number;
  device_serial: string;
  raw: string;
  created_at: string;
  location:string;
  mobile_location?: string;
  coordinates?: string;
}

export interface Employee {
  id: number;
  device_user_id: string;
  name: string;
  department: string | null;
  email: string | null;
  created_at: string;
  emp_id: string;
  location?: string | null;
  isVerified?: boolean;
  emp_type?: string | null;
  verifiedBy?: string | null;
  assignedLocation?: string | null;
  project?: string | null;
  company?: string | null;
  civil_id?: string | null;
  designation?: string | null;
  nationality?: string | null;
}

export interface EmployeeSummary extends Employee {
  totalPunches: number;
  firstIn: string | null;
  lastOut: string | null;
  isPresent: boolean;
  location?: string | null;
  remarks?: string[];
}

export type VerifyType = 0 | 1 | 4 | 15;
export type PunchType = 0 | 1;
