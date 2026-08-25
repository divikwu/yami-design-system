import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

type RuntimeEnvironment = Record<string, string | undefined>;

interface StorageRootOptions {
  environment?: RuntimeEnvironment;
  homeDirectory?: string;
}

function absoluteEnvironmentPath(name: string, value: string) {
  if (!isAbsolute(value)) {
    throw new Error(`${name} must be an absolute path.`);
  }
  return resolve(value);
}

function defaultApplicationStorageRoot(options: StorageRootOptions) {
  const homeDirectory = options.homeDirectory ?? homedir();
  return join(homeDirectory, "Yami Topic Generator");
}

function resolveUnifiedStorageRoot(options: StorageRootOptions) {
  const environment = options.environment ?? process.env;
  const configured = environment.TOPIC_GENERATOR_STORAGE_ROOT?.trim();
  if (configured) {
    return absoluteEnvironmentPath("TOPIC_GENERATOR_STORAGE_ROOT", configured);
  }
  if (environment.NODE_ENV === "production") {
    throw new Error(
      "TOPIC_GENERATOR_STORAGE_ROOT is required in production and must point to persistent storage.",
    );
  }
  return defaultApplicationStorageRoot(options);
}

export function resolveTopicGeneratorRunStorageRoot(options: StorageRootOptions = {}) {
  const environment = options.environment ?? process.env;
  const configured = environment.TOPIC_GENERATOR_RUN_ROOT?.trim();
  if (configured) {
    return absoluteEnvironmentPath("TOPIC_GENERATOR_RUN_ROOT", configured);
  }
  return join(resolveUnifiedStorageRoot(options), "runs");
}

export function resolveTopicGeneratorAssetStorageRoot(options: StorageRootOptions = {}) {
  const environment = options.environment ?? process.env;
  const configured = environment.TOPIC_GENERATOR_ASSET_ROOT?.trim();
  if (configured) {
    return absoluteEnvironmentPath("TOPIC_GENERATOR_ASSET_ROOT", configured);
  }
  return join(resolveUnifiedStorageRoot(options), "assets");
}
