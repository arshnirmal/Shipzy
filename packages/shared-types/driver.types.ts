export interface Driver extends User {
  vehicleType: string;
  licenseNumber: string;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  rating?: number;
}

export interface UpdateDriverAvailability {
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}
