import {
  checkbox,
  confirm,
  input,
  number,
  password,
  select,
} from "@inquirer/prompts";
import {
  DEFAULT_API_URL,
  DEFAULT_COUNTS,
  MODULE_LABELS,
  ORDER_FLOW_CHOICES,
  SCENARIO_LABELS,
  SCENARIO_MODULES,
  VALID_MODULES,
  VALID_SCENARIOS,
  buildDefaultManifestPath,
} from "./constants.js";
import {
  ModuleName,
  OrderFlow,
  ScenarioName,
  SeedConfig,
  TargetQuery,
} from "./types.js";

const toPositiveInt = (value: number | undefined, fallback: number) => {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  return fallback;
};

const toNonNegativeInt = (value: number | undefined, fallback: number) => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return fallback;
};

const askTargetQuery = async (roleLabel: string): Promise<TargetQuery> => {
  const useTarget = await confirm({
    message: `Do you want to target an existing ${roleLabel}?`,
    default: false,
  });

  if (!useTarget) {
    return {};
  }

  const mode = await select<{ mode: "id" | "email" }>({
    message: `How do you want to identify the ${roleLabel}?`,
    choices: [
      {
        name: "User ID",
        value: { mode: "id" },
      },
      {
        name: "Email",
        value: { mode: "email" },
      },
    ],
  });

  const target: TargetQuery = {};

  if (mode.mode === "id") {
    const id = await number({
      message: `${roleLabel} user ID:`,
      validate: (value) => {
        if (
          typeof value !== "number" ||
          !Number.isInteger(value) ||
          value <= 0
        ) {
          return "Enter a positive integer ID.";
        }
        return true;
      },
    });
    target.id = Number(id);
  } else {
    const email = await input({
      message: `${roleLabel} email:`,
      validate: (value) => {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return "Email is required.";
        if (!normalized.includes("@")) return "Enter a valid email.";
        return true;
      },
    });
    target.email = email.trim().toLowerCase();
  }

  const needsPassword = await confirm({
    message: `Do you want to provide a password for ${roleLabel} login?`,
    default: false,
  });

  if (needsPassword) {
    const targetPassword = await password({
      message: `${roleLabel} password:`,
      validate: (value) =>
        value.trim().length > 0 ? true : "Password cannot be empty.",
    });
    target.password = targetPassword;
  }

  return target;
};

const askCounts = async (modules: Set<ModuleName>) => {
  const counts = { ...DEFAULT_COUNTS };

  if (modules.has("users")) {
    counts.users = toNonNegativeInt(
      await number({
        message: "How many client users should be created?",
        default: DEFAULT_COUNTS.users,
      }),
      DEFAULT_COUNTS.users,
    );
  }

  if (modules.has("drivers")) {
    counts.drivers = toNonNegativeInt(
      await number({
        message: "How many drivers should be created?",
        default: DEFAULT_COUNTS.drivers,
      }),
      DEFAULT_COUNTS.drivers,
    );
  }

  if (modules.has("business")) {
    counts.businesses = toNonNegativeInt(
      await number({
        message: "How many business accounts should be created?",
        default: DEFAULT_COUNTS.businesses,
      }),
      DEFAULT_COUNTS.businesses,
    );
  }

  if (modules.has("orders")) {
    counts.orders = toNonNegativeInt(
      await number({
        message: "How many orders should be created?",
        default: DEFAULT_COUNTS.orders,
      }),
      DEFAULT_COUNTS.orders,
    );
  }

  if (modules.has("ratings")) {
    counts.ratings = toNonNegativeInt(
      await number({
        message: "How many ratings should be created?",
        default: DEFAULT_COUNTS.ratings,
      }),
      DEFAULT_COUNTS.ratings,
    );
  }

  return counts;
};

const askModules = async (): Promise<{
  scenarios: ScenarioName[];
  modules: Set<ModuleName>;
}> => {
  const useScenarios = await confirm({
    message: "Start with scenario presets?",
    default: true,
  });

  let selectedScenarios: ScenarioName[] = [];
  let selectedModules = new Set<ModuleName>();

  if (useScenarios) {
    selectedScenarios = await checkbox<ScenarioName>({
      message: "Choose one or more scenarios:",
      choices: VALID_SCENARIOS.map((scenario) => ({
        name: SCENARIO_LABELS[scenario],
        value: scenario,
        checked: scenario === "frontend-all",
      })),
      validate: (values) =>
        values.length > 0 ? true : "Select at least one scenario.",
    });

    for (const scenario of selectedScenarios) {
      for (const moduleName of SCENARIO_MODULES[scenario]) {
        selectedModules.add(moduleName);
      }
    }
  }

  const customizeModules = await confirm({
    message: "Customize modules explicitly?",
    default: !useScenarios,
  });

  if (customizeModules) {
    const moduleValues = await checkbox<ModuleName>({
      message: "Choose modules to run:",
      choices: VALID_MODULES.map((moduleName) => ({
        name: MODULE_LABELS[moduleName],
        value: moduleName,
        checked: selectedModules.has(moduleName),
      })),
      validate: (values) =>
        values.length > 0 ? true : "Select at least one module.",
    });

    selectedModules = new Set(moduleValues);
  }

  if (selectedModules.has("ratings") && !selectedModules.has("orders")) {
    selectedModules.add("orders");
  }

  return {
    scenarios: selectedScenarios,
    modules: selectedModules,
  };
};

export const collectSeedConfig = async (): Promise<SeedConfig> => {
  const apiUrl = await input({
    message: "API base URL:",
    default: DEFAULT_API_URL,
    validate: (value) => {
      const trimmed = value.trim();
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return "API URL must start with http:// or https://";
      }
      return true;
    },
  });

  const { scenarios, modules } = await askModules();

  const orderFlow = modules.has("orders")
    ? ((await select<OrderFlow>({
        message: "Order flow strategy:",
        choices: ORDER_FLOW_CHOICES.map((item) => ({
          name: item.label,
          value: item.name,
        })),
      })) as OrderFlow)
    : ("pending" as OrderFlow);

  const counts = await askCounts(modules);

  const dbTargetLookup =
    modules.has("orders") &&
    (await confirm({
      message: "Enable DB target lookup for existing users/drivers?",
      default: false,
    }));

  const targetClient =
    modules.has("orders") && dbTargetLookup
      ? await askTargetQuery("client")
      : {};

  const targetDriver =
    modules.has("orders") && dbTargetLookup
      ? await askTargetQuery("driver")
      : {};

  const targetBusiness =
    modules.has("business") && dbTargetLookup
      ? await askTargetQuery("business")
      : {};

  const seed = toPositiveInt(
    await number({
      message: "Deterministic seed number:",
      default: 42,
    }),
    42,
  );

  const tag = await input({
    message: "Tag for generated data:",
    default: "seed",
    validate: (value) =>
      value.trim().length > 0 ? true : "Tag cannot be empty.",
  });

  const manifestFile = await input({
    message: "Manifest output file path:",
    default: buildDefaultManifestPath(),
    validate: (value) =>
      value.trim().length > 0 ? true : "Path cannot be empty.",
  });

  const requestDelayMs = toNonNegativeInt(
    await number({
      message: "Delay between requests (ms):",
      default: 150,
    }),
    150,
  );

  const failFast = await confirm({
    message: "Fail fast on first non-recoverable error?",
    default: false,
  });

  return {
    apiUrl: apiUrl.trim(),
    seed,
    scenarios,
    modules,
    orderFlow,
    failFast,
    dbTargetLookup,
    requestDelayMs,
    counts,
    targetClient,
    targetDriver,
    targetBusiness,
    manifestFile: manifestFile.trim(),
    tag: tag.trim(),
  };
};
