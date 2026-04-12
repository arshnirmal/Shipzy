import path from "node:path";
import { ModuleName, ScenarioName, SeedCounts } from "./types.js";

export const DEFAULT_SEED_PASSWORD = "Password123!";

// Curated seed data to avoid gibberish identities in demo environments.
// Keep this list short and realistic; uniqueness is ensured via the email builder.
export const REALISTIC_FIRST_NAMES = [
  "Aarav",
  "Vihaan",
  "Aditya",
  "Arjun",
  "Kabir",
  "Rohan",
  "Ishaan",
  "Kunal",
  "Rahul",
  "Siddharth",
  "Ananya",
  "Aditi",
  "Isha",
  "Kavya",
  "Meera",
  "Nisha",
  "Priya",
  "Riya",
  "Sanya",
  "Tanvi",
];

export const REALISTIC_LAST_NAMES = [
  "Sharma",
  "Verma",
  "Gupta",
  "Mehta",
  "Patel",
  "Singh",
  "Khan",
  "Kapoor",
  "Iyer",
  "Reddy",
  "Nair",
  "Chopra",
  "Bose",
  "Joshi",
  "Malhotra",
  "Das",
];

export const REALISTIC_BUSINESS_NAMES = [
  "Mehta Grocery",
  "Patel Supermart",
  "Sharma Medical",
  "Kapoor Electronics",
  "Gupta Stationery",
  "Nair Fresh Foods",
  "Singh Bakery",
  "Iyer Kitchen",
  "Verma Hardware",
  "Chopra Pharmacy",
];

export const DEFAULT_API_URL =
  process.env.API_URL ||
  `http://${process.env.BACKEND_HOST || "localhost"}:${process.env.BACKEND_PORT || "3000"}/api/v1`;

export const DEFAULT_COUNTS: SeedCounts = {
  users: 3,
  drivers: 2,
  businesses: 2,
  orders: 6,
  ratings: 3,
};

export const VALID_MODULES: ModuleName[] = [
  "static",
  "users",
  "drivers",
  "businesses",
  "orders",
  "ratings",
  "addresses",
];

export const VALID_SCENARIOS: ScenarioName[] = [
  "frontend-user",
  "frontend-driver",
  "frontend-business",
  "frontend-all",
  "api-smoke",
];

export const SCENARIO_MODULES: Record<ScenarioName, ModuleName[]> = {
  "frontend-user": ["static", "users", "orders"],
  "frontend-driver": ["static", "drivers", "orders"],
  "frontend-business": ["static", "businesses"],
  "frontend-all": [
    "static",
    "users",
    "drivers",
    "businesses",
    "orders",
    "addresses",
  ],
  "api-smoke": ["static", "addresses"],
};

export const MODULE_LABELS: Record<ModuleName, string> = {
  static: "Static catalog",
  users: "Client users",
  drivers: "Couriers/drivers",
  businesses: "Business accounts",
  orders: "Order lifecycle",
  ratings: "Ratings (opt-in)",
  addresses: "Address intelligence",
};

export const SCENARIO_LABELS: Record<ScenarioName, string> = {
  "frontend-user": "Frontend User app",
  "frontend-driver": "Frontend Driver app",
  "frontend-business": "Frontend Business app",
  "frontend-all": "Frontend all apps",
  "api-smoke": "API smoke checks",
};

export const ORDER_FLOW_CHOICES = [
  {
    name: "pending",
    label: "Pending only (no acceptance)",
  },
  {
    name: "mixed",
    label: "Mixed flow (pending/cancelled/accepted/in-progress)",
  },
  {
    name: "delivered",
    label: "Delivered-heavy flow",
  },
] as const;

export const buildDefaultManifestPath = () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(
    process.cwd(),
    "scripts/output",
    `seed-manifest-${stamp}.json`,
  );
};
