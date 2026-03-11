/**
 * Customer deployment config resolution.
 *
 * Resolution order (first found wins):
 *   1. $JADE_DEPLOY_CONFIG env var (absolute path)
 *   2. .jade/deploy.json in cwd (project-level)
 *   3. ~/.jade/deploy.json (user-level)
 *   4. /etc/jade/deploy.json (system-level, MDM-deployed)
 *
 * Returns null if no config found — this is valid for pro-max mode
 * where zero-config is the default.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { DeployConfig } from "./types.js";

const SYSTEM_CONFIG_PATH = "/etc/jade/deploy.json";

/**
 * Candidate paths for deploy config, in resolution order.
 */
export function getConfigCandidates(cwd?: string): string[] {
  const candidates: string[] = [];

  // 1. Env override
  const envPath = process.env["JADE_DEPLOY_CONFIG"];
  if (envPath) {
    candidates.push(envPath);
  }

  // 2. Project-level
  const projectDir = cwd ?? process.cwd();
  candidates.push(join(projectDir, ".jade", "deploy.json"));

  // 3. User-level
  candidates.push(join(homedir(), ".jade", "deploy.json"));

  // 4. System-level
  candidates.push(SYSTEM_CONFIG_PATH);

  return candidates;
}

/**
 * Resolve the deployment config from the filesystem.
 * Returns null if no config exists (valid for pro-max zero-config).
 */
export function resolveDeployConfig(cwd?: string): DeployConfig | null {
  const candidates = getConfigCandidates(cwd);

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const raw = readFileSync(candidate, "utf-8");
      const config = JSON.parse(raw) as DeployConfig;
      return config;
    }
  }

  return null;
}

/**
 * Build environment variables from a deploy config.
 * These are injected into Claude Code sessions and agent processes.
 * Secrets are passed as env vars, never written to disk files in the repo.
 */
export function buildEnvFromConfig(config: DeployConfig): Record<string, string> {
  const env: Record<string, string> = {};

  // Cloud auth
  switch (config.cloudAuth.provider) {
    case "anthropic-direct":
      if (config.cloudAuth.apiKey) {
        env["ANTHROPIC_API_KEY"] = config.cloudAuth.apiKey;
      }
      break;
    case "aws-bedrock":
      if (config.cloudAuth.bedrock) {
        const b = config.cloudAuth.bedrock;
        env["AWS_REGION"] = b.region;
        if (b.accessKeyId) env["AWS_ACCESS_KEY_ID"] = b.accessKeyId;
        if (b.secretAccessKey) env["AWS_SECRET_ACCESS_KEY"] = b.secretAccessKey;
        if (b.sessionToken) env["AWS_SESSION_TOKEN"] = b.sessionToken;
        if (b.modelId) env["ANTHROPIC_BEDROCK_MODEL_ID"] = b.modelId;
      }
      break;
    case "gcp-vertex":
      if (config.cloudAuth.vertex) {
        const v = config.cloudAuth.vertex;
        env["ANTHROPIC_VERTEX_PROJECT_ID"] = v.projectId;
        env["CLOUD_ML_REGION"] = v.region;
        if (v.credentialsPath) env["GOOGLE_APPLICATION_CREDENTIALS"] = v.credentialsPath;
      }
      break;
    // pro-max: no env vars needed
  }

  // Admin API
  if (config.adminAuth?.adminApiKey) {
    env["ANTHROPIC_ADMIN_KEY"] = config.adminAuth.adminApiKey;
  }

  // Services
  if (config.services?.github?.token) {
    env["GITHUB_TOKEN"] = config.services.github.token;
    env["GITHUB_PERSONAL_ACCESS_TOKEN"] = config.services.github.token;
  }
  if (config.services?.slack?.botToken) {
    env["SLACK_BOT_TOKEN"] = config.services.slack.botToken;
    env["SLACK_TEAM_ID"] = config.services.slack.teamId;
  }
  if (config.services?.stripe?.secretKey) {
    env["STRIPE_SECRET_KEY"] = config.services.stripe.secretKey;
  }
  if (config.services?.neon?.apiKey) {
    env["NEON_API_KEY"] = config.services.neon.apiKey;
  }
  if (config.services?.vercel?.token) {
    env["VERCEL_TOKEN"] = config.services.vercel.token;
  }

  // Telemetry
  if (config.telemetry?.enabled) {
    env["CLAUDE_CODE_ENABLE_TELEMETRY"] = "1";
    env["OTEL_METRICS_EXPORTER"] = config.telemetry.exporter;
    env["OTEL_EXPORTER_OTLP_ENDPOINT"] = config.telemetry.endpoint;
    if (config.telemetry.headers) {
      env["OTEL_EXPORTER_OTLP_HEADERS"] = Object.entries(config.telemetry.headers)
        .map(([k, v]) => `${k}=${v}`)
        .join(",");
    }
    if (config.telemetry.resourceAttributes) {
      env["OTEL_RESOURCE_ATTRIBUTES"] = Object.entries(config.telemetry.resourceAttributes)
        .map(([k, v]) => `${k}=${v}`)
        .join(",");
    }
  }

  return env;
}

/**
 * Validate a deploy config has the minimum required fields.
 * Returns a list of validation errors (empty = valid).
 */
export function validateDeployConfig(config: DeployConfig): string[] {
  const errors: string[] = [];

  if (!config.version) {
    errors.push("Missing required field: version");
  }
  if (!config.organization) {
    errors.push("Missing required field: organization");
  }
  if (!config.cloudAuth) {
    errors.push("Missing required field: cloudAuth");
  } else {
    if (!config.cloudAuth.provider) {
      errors.push("Missing required field: cloudAuth.provider");
    }
    if (config.cloudAuth.provider === "anthropic-direct" && !config.cloudAuth.apiKey) {
      errors.push("anthropic-direct provider requires cloudAuth.apiKey");
    }
    if (config.cloudAuth.provider === "aws-bedrock" && !config.cloudAuth.bedrock?.region) {
      errors.push("aws-bedrock provider requires cloudAuth.bedrock.region");
    }
    if (config.cloudAuth.provider === "gcp-vertex") {
      if (!config.cloudAuth.vertex?.projectId) {
        errors.push("gcp-vertex provider requires cloudAuth.vertex.projectId");
      }
      if (!config.cloudAuth.vertex?.region) {
        errors.push("gcp-vertex provider requires cloudAuth.vertex.region");
      }
    }
  }

  return errors;
}
