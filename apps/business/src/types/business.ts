import type { FareBreakdown, OrderLocation, PaymentMode } from "./orders";

// ============================================================================
// DRAFT
// ============================================================================

export type DraftState = "incomplete" | "ready" | "submitted";

export type DraftFulfillment = {
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId?: number | null;
  packageTypeId?: number | null;
  paymentMethodId: number;
  paymentMode?: PaymentMode;
};

export type DraftPackage = {
  description?: string | null;
  specialInstructions?: string | null;
  declaredValue?: number | null;
  notifyRecipientSms?: boolean;
};

export type DraftItem = {
  name: string;
  quantity: number;
  value?: number | null;
};

export type DraftSchedule = {
  pickupAt?: string | null;
  deliveryAt?: string | null;
};

export type Draft = {
  draftId: number;
  draftUuid: string;
  name?: string | null;
  state: DraftState;
  fulfillment?: DraftFulfillment | null;
  pickupLocation?: OrderLocation | null;
  deliveryLocation?: OrderLocation | null;
  items: DraftItem[];
  package?: DraftPackage | null;
  schedule?: DraftSchedule | null;
  pricing?: FareBreakdown | null;
  couponCode?: string | null;
  notes?: string | null;
  templateId?: number | null;
  submittedOrderId?: number | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DraftCreatePayload = {
  name?: string;
  fulfillment?: DraftFulfillment;
  pickupLocation?: OrderLocation;
  deliveryLocation?: OrderLocation;
  items?: DraftItem[];
  package?: DraftPackage;
  schedule?: DraftSchedule;
  pricing?: FareBreakdown;
  couponCode?: string;
  notes?: string;
  templateId?: number;
};

export type DraftUpdatePayload = DraftCreatePayload;

export type DraftListResponse = {
  success: true;
  message: string;
  data: {
    drafts: Draft[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
  timestamp: string;
};

export type DraftResponse = {
  success: true;
  message: string;
  data: Draft;
  timestamp: string;
};

// ============================================================================
// TEMPLATE
// ============================================================================

export type Template = {
  templateId: number;
  templateUuid: string;
  name: string;
  description?: string | null;
  fulfillment?: DraftFulfillment | null;
  pickupLocation?: OrderLocation | null;
  deliveryLocation?: OrderLocation | null;
  items: DraftItem[];
  package?: DraftPackage | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TemplateCreatePayload = {
  name: string;
  description?: string;
  fulfillment?: DraftFulfillment;
  pickupLocation?: OrderLocation;
  deliveryLocation?: OrderLocation;
  items?: DraftItem[];
  package?: DraftPackage;
};

export type TemplateUpdatePayload = Partial<TemplateCreatePayload>;

export type TemplateListResponse = {
  success: true;
  message: string;
  data: {
    templates: Template[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
  timestamp: string;
};

export type TemplateResponse = {
  success: true;
  message: string;
  data: Template;
  timestamp: string;
};

// ============================================================================
// STATIC / CREATE ORDER DATA
// ============================================================================

export type DeliveryType = {
  deliveryTypeId: number;
  name: string;
  displayName: string;
  description?: string | null;
  baseRate: number;
  perKmRate: number;
  isActive: boolean;
};

export type VehicleCategory = {
  categoryId: number;
  name: string;
  displayName: string;
  description?: string | null;
  maxWeightKg: number;
  iconUrl?: string | null;
};

export type WeightTier = {
  tierId: number;
  name: string;
  minWeightKg: number;
  maxWeightKg: number;
  additionalCharge: number;
};

export type PackageType = {
  packageTypeId: number;
  name: string;
  description?: string | null;
  specialHandlingFee: number;
  requiresSpecialHandling: boolean;
};

export type PaymentMethod = {
  methodId: number;
  name: string;
  displayName: string;
  isActive: boolean;
};

export type CreateOrderData = {
  deliveryTypes: DeliveryType[];
  vehicleCategories: VehicleCategory[];
  weightTiers: WeightTier[];
  packageTypes: PackageType[];
  paymentMethods: PaymentMethod[];
};

export type CreateOrderDataResponse = {
  success: true;
  message: string;
  data: CreateOrderData;
  timestamp: string;
};

// ============================================================================
// ANALYTICS
// ============================================================================

export type AnalyticsData = {
  period: { from: string; to: string };
  orders: {
    total: number;
    delivered: number;
    cancelled: number;
    active: number;
    successRate: number;
  };
  spend: {
    total: number;
    average: number;
    currency: string;
  };
  delivery: {
    avgDurationMins: number;
  };
};

export type AnalyticsResponse = {
  success: true;
  message: string;
  data: { analytics: AnalyticsData };
  timestamp: string;
};

// ============================================================================
// BULK CREATE
// ============================================================================

export type BulkOrderResultItem = {
  index: number;
  success: boolean;
  orderId?: number;
  draftId?: number;
  isDraft?: boolean;
  error?: string;
};

export type BulkOrderResult = {
  bulk: {
    requested: number;
    created: number;
    failed: number;
    results: BulkOrderResultItem[];
  };
};

export type BulkOrderResponse = {
  success: true;
  message: string;
  data: BulkOrderResult;
  timestamp: string;
};

export type BulkOrderRow = {
  fulfillment: {
    deliveryTypeId: number;
    vehicleCategoryId: number;
    weightTierId: number;
    packageTypeId?: number | null;
    paymentMethodId: number;
    paymentMode?: PaymentMode;
  };
  pickup: {
    address: string;
    contactName: string;
    contactPhone: string;
    building?: string;
    floor?: string;
    flatNumber?: string;
    howToReach?: string;
  };
  delivery: {
    address: string;
    contactName: string;
    contactPhone: string;
    building?: string;
    floor?: string;
    flatNumber?: string;
    howToReach?: string;
  };
  items?: {
    itemName: string;
    quantity: number;
  }[];
  package?: {
    description?: string;
    notifyRecipientSms?: boolean;
  };
};

// ============================================================================
// ADDRESS SEARCH
// ============================================================================

export type AddressSuggestion = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  placeType: string;
  coordinates?: { latitude: number; longitude: number } | null;
};

export type AddressSearchResponse = {
  success: true;
  message: string;
  data: {
    search: {
      query: string;
      sessionToken: string;
      suggestions: AddressSuggestion[];
      total: number;
    };
  };
  timestamp: string;
};

export type PlaceDetails = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  coordinates?: { latitude: number; longitude: number } | null;
  context?: Record<string, string | null | undefined> | null;
};

export type PlaceRetrieveResponse = {
  success: true;
  message: string;
  data: { place: PlaceDetails };
  timestamp: string;
};

// Resolved address used across location forms
export type ResolvedAddress = {
  fullAddress: string;
  latitude: number;
  longitude: number;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  building?: string;
  floor?: string;
  flatNumber?: string;
  howToReach?: string;
  contactName: string;
  contactPhone: string;
};
