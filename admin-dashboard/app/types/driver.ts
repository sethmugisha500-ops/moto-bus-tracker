// types/driver.ts
export interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  vehicleType: 'MOTO' | 'BUS' | 'MINIBUS';
  vehicleNumber: string;
  vehicleModel: string;
  isApproved: boolean;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  joinedAt: string;
  isActive: boolean;
  profileImage?: string;
  documents?: {
    licenseFront: string;
    licenseBack: string;
    vehicleRegistration: string;
    insurance: string;
  };
}

export interface DriverStats {
  total: number;
  active: number;
  pending: number;
  online: number;
  offline: number;
}