export type OrderStatus =
  | "scheduled"
  | "pending"
  | "accepted"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "undeliverable"
  | "returning"
  | "returned";

export type OrderLocation = {
  addressId?: number | null;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  building?: string | null;
  floor?: string | null;
  flatNumber?: string | null;
  landmark?: string | null;
  howToReach?: string | null;
  contactName: string;
  contactPhone: string;
};

export type FareBreakdown = {
  basePrice: number;
  distanceKm: number;
  distancePrice: number;
  weightSurcharge: number;
  platformFee?: number;
  subtotalBeforeTax?: number;
  gstAmount?: number;
  specialHandlingFee?: number;
  totalPrice: number;
  currency?: string;
  /** Volume discount fields — present on business orders that qualify for a tier */
  discountPct?: number;
  discountAmount?: number;
};

export type BaseOrder = {
  identifiers: {
    orderId: number;
    orderUuid: string;
    orderNumber?: string | null;
  };
  status: OrderStatus;
  fulfillment: {
    deliveryTypeId: number;
    vehicleCategoryId: number;
    weightTierId?: number | null;
    packageTypeId?: number | null;
    paymentMethodId?: number | null;
  };
  locations: {
    pickup: OrderLocation;
    delivery: OrderLocation;
  };
  package: {
    description?: string | null;
    specialInstructions?: string | null;
    declaredValue?: number | null;
    notifyRecipientSms?: boolean;
  };
  pricing: FareBreakdown;
  metrics: {
    estimatedDistanceKm?: number | null;
    actualDistanceKm?: number | null;
    actualDurationMins?: number | null;
    totalPrice: number;
  };
  timeline: {
    createdAt: string;
    acceptedAt?: string | null;
    pickedUpAt?: string | null;
    inTransitAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
  };
};

export type OrderCourier = {
  userId: number;
  name?: string | null;
  phone?: string | null;
  profilePictureUrl?: string | null;
};

export type OrderListItem = {
  order: BaseOrder;
  courier?: OrderCourier | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedOrdersResponse = {
  success: true;
  message: string;
  data: OrderListItem[];
  meta: { pagination: Pagination };
  timestamp: string;
};

export type OrderFilters = {
  search: string;
  status: "all" | "active" | "completed" | "cancelled";
  dateFrom: string;
  dateTo: string;
  deliveryTypeId: string;
  minPrice: string;
  maxPrice: string;
  sortBy: "createdAt" | "totalPrice" | "deliveredAt" | "pickedUpAt";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
};

export type BulkCancelApiResponse = {
  success: true;
  message: string;
  data: {
    bulk: {
      requested: number;
      cancelled: number;
      failed: number;
      results: { orderId: number; success: boolean; error?: string }[];
    };
  };
  timestamp: string;
};

export const DEFAULT_FILTERS: OrderFilters = {
  search: "",
  status: "all",
  dateFrom: "",
  dateTo: "",
  deliveryTypeId: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  limit: 20,
};
