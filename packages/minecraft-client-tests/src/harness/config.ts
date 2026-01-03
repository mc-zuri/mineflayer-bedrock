import type { ServerEdition, ServerMode } from '../abstractions/server.ts';

export interface TestConfig {
  /** Which editions to run tests on */
  editions: ServerEdition[];

  /** Which server modes to use */
  modes: ServerMode[];

  /** Versions to test */
  versions: {
    java: string;
    bedrock: string;
  };

  /** Test timeout in ms */
  timeout: number;

  /** Whether to auto-download servers if not found */
  autoDownload: boolean;
}

/**
 * Default test configuration.
 */
export const defaultConfig: TestConfig = {
  editions: ['java', 'bedrock'],
  modes: ['real'],
  versions: {
    java: '1.21.5',
    bedrock: '1.21.130',
  },
  timeout: 120000,
  autoDownload: true,
};

/**
 * Load test configuration from environment variables.
 *
 * Environment variables:
 * - TEST_EDITIONS: Comma-separated list of editions (e.g., "java,bedrock" or "java")
 * - TEST_MODES: Comma-separated list of modes (e.g., "real" or "real,mock")
 * - TEST_JAVA_VERSION: Java version to test (e.g., "1.20.4")
 * - TEST_BEDROCK_VERSION: Bedrock version to test (e.g., "1.21.130")
 * - TEST_TIMEOUT: Test timeout in ms
 * - TEST_AUTO_DOWNLOAD: Whether to auto-download servers ("true" or "false")
 */
export function loadConfig(): TestConfig {
  const config = { ...defaultConfig };

  // Parse editions
  if (process.env.TEST_EDITIONS) {
    config.editions = process.env.TEST_EDITIONS.split(',').map((e) =>
      e.trim().toLowerCase()
    ) as ServerEdition[];
  }

  // Parse modes
  if (process.env.TEST_MODES) {
    config.modes = process.env.TEST_MODES.split(',').map((m) =>
      m.trim().toLowerCase()
    ) as ServerMode[];
  }

  // Parse versions
  if (process.env.TEST_JAVA_VERSION) {
    config.versions.java = process.env.TEST_JAVA_VERSION;
  }
  if (process.env.TEST_BEDROCK_VERSION) {
    config.versions.bedrock = process.env.TEST_BEDROCK_VERSION;
  }

  // Parse timeout
  if (process.env.TEST_TIMEOUT) {
    config.timeout = parseInt(process.env.TEST_TIMEOUT, 10);
  }

  // Parse auto-download
  if (process.env.TEST_AUTO_DOWNLOAD) {
    config.autoDownload = process.env.TEST_AUTO_DOWNLOAD.toLowerCase() === 'true';
  }

  return config;
}

/**
 * Get the version for a specific edition from config.
 */
export function getVersionForEdition(edition: ServerEdition, config: TestConfig): string {
  return edition === 'java' ? config.versions.java : config.versions.bedrock;
}
