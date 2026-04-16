export type Role = "client" | "courier" | "business";

export type OrderFlow = "pending" | "mixed" | "delivered";

export type ModuleName =
  | "static"
  | "users"
  | "drivers"
  | "business"
  | "orders"
  | "ratings"
  | "addresses";

export type ScenarioName =
  | "frontend-user"
  | "frontend-driver"
  | "frontend-business"
  | "frontend-all"
  | "api-smoke";

export type ActionStats = {
  success: number;
  failure: number;
};

export type TargetQuery = {
  id?: number;
  email?: string;
  password?: string;
};

export type ActorAuth = {
  userId: number;
  email: string;
  fullName: string;
  role: Role;
  phoneNumber?: string;
  accessToken: string;
  password: string;
  source: "created" | "existing-db";
};

export type OrderRecord = {
  orderId: number;
  orderNumber?: string;
  status: string;
  clientUserId: number;
  courierUserId?: number;
};

export type RatingRecord = {
  orderId: number;
  driverId: number;
  customerId: number;
  rating: number;
};

export type FailureEntry = {
  action: string;
  status?: number;
  message: string;
  details?: string;
};

export type CreateOrderCatalog = {
  deliveryTypes: any[];
  packageTypes: any[];
  paymentMethods: any[];
};

export type SeedCounts = {
  users: number;
  drivers: number;
  businesses: number;
  orders: number;
  ratings: number;
};

export type SeedConfig = {
  apiUrl: string;
  seed: number;
  scenarios: ScenarioName[];
  modules: Set<ModuleName>;
  orderFlow: OrderFlow;
  failFast: boolean;
  dbTargetLookup: boolean;
  requestDelayMs: number;
  counts: SeedCounts;
  targetClient: TargetQuery;
  targetDriver: TargetQuery;
  targetBusiness: TargetQuery;
  manifestFile: string;
  tag: string;
};

export type DrizzleModule = {
  drizzlePool: {
    query: (queryText: string, values: unknown[]) => Promise<{ rows: any[] }>;
    end: () => Promise<void>;
  };
};

export type SeedManifest = {
  run: Record<string, unknown>;
  created: {
    clients: Array<Record<string, unknown>>;
    drivers: Array<Record<string, unknown>>;
    businesses: Array<Record<string, unknown>>;
    orders: Array<Record<string, unknown>>;
    ratings: Array<Record<string, unknown>>;
    addressesIntelligence: Array<Record<string, unknown>>;
    targets: {
      client?: Record<string, unknown>;
      driver?: Record<string, unknown>;
      business?: Record<string, unknown>;
    };
  };
  failures: FailureEntry[];
  stats: Record<string, ActionStats>;
};
