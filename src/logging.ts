import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { getLogger, setup, ConsoleHandler } from "https://deno.land/std@0.224.0/log/mod.ts";
import { join, fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";

const __dirname = fromFileUrl(new URL(".", import.meta.url));
const projectRoot = join(__dirname, "..");

await load({ export: true, envPath: join(projectRoot, ".env") });

const logLevel = Deno.env.get("LOG_LEVEL") || "INFO";

console.log("Current log level:", logLevel); // Debugging line

await setup({
  handlers: {
    console: new ConsoleHandler(logLevel),
  },
  loggers: {
    default: {
      level: logLevel,
      handlers: ["console"],
    },
  },
});

export const logger = getLogger();