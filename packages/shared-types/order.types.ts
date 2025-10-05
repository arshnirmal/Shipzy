export interface Order {
  id: string;
  userId: string;
  driverId?: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  status: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateOrderRequest {
  userId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
}

export type OrderStatus = Order["status"];
