import { collectSeedConfig } from "./prompts.js";
import { SeedRunner } from "./runner.js";

async function main() {
  try {
    if (process.argv.length > 2) {
      console.log(
        "ℹ️ This tool is interactive-only. Extra CLI arguments are ignored.",
      );
    }

    console.log("🚀 Shipzy Interactive Seeder");
    const config = await collectSeedConfig();

    console.log("\n📋 Execution plan");
    console.log(`   API URL: ${config.apiUrl}`);
    console.log(`   Scenarios: ${config.scenarios.join(",") || "none"}`);
    console.log(`   Modules: ${[...config.modules].join(",")}`);
    console.log(`   Order flow: ${config.orderFlow}`);
    console.log(`   Seed: ${config.seed}`);

    const runner = new SeedRunner(config);
    try {
      await runner.run();
      console.log("\n✨ Seeding completed.");
    } finally {
      await runner.cleanup();
    }
  } catch (error: any) {
    if (error?.name === "ExitPromptError") {
      console.log("\nSeeding cancelled by user.");
      return;
    }

    console.error(
      `\n💥 Interactive seeder failed: ${error.message || "Unknown error"}`,
    );
    process.exitCode = 1;
  }
}

await main();
