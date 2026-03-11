import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  resolveDeployConfig,
  buildEnvFromConfig,
  validateDeployConfig,
  getConfigCandidates,
} from "../src/jade/deploy/resolve.js";
import type { DeployConfig } from "../src/jade/deploy/types.js";

const MINIMAL_CONFIG: DeployConfig = {
  version: "1",
  organization: "Test Corp",
  cloudAuth: {
    provider: "anthropic-direct",
    apiKey: "sk-ant-test-key",
  },
};

const BEDROCK_CONFIG: DeployConfig = {
  version: "1",
  organization: "AWS Corp",
  cloudAuth: {
    provider: "aws-bedrock",
    bedrock: {
      region: "us-east-1",
      accessKeyId: "AKIATEST",
      secretAccessKey: "secret",
    },
  },
};

const FULL_CONFIG: DeployConfig = {
  version: "1",
  organization: "Full Corp",
  cloudAuth: {
    provider: "anthropic-direct",
    apiKey: "sk-ant-api-key",
  },
  adminAuth: {
    adminApiKey: "sk-ant-admin01-test",
    organizationId: "org-123",
  },
  services: {
    github: { token: "ghp_test" },
    slack: { botToken: "xoxb-test", teamId: "T123" },
    stripe: { secretKey: "sk_test_stripe" },
    neon: { apiKey: "neon-key" },
  },
  telemetry: {
    enabled: true,
    endpoint: "https://otel.example.com:4318",
    exporter: "otlp",
    resourceAttributes: { "team.id": "platform" },
  },
};

describe("deploy/resolve", () => {
  let tmpDir: string;
  let origEnv: string | undefined;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "jade-deploy-test-"));
    origEnv = process.env["JADE_DEPLOY_CONFIG"];
    delete process.env["JADE_DEPLOY_CONFIG"];
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    if (origEnv) process.env["JADE_DEPLOY_CONFIG"] = origEnv;
    else delete process.env["JADE_DEPLOY_CONFIG"];
  });

  it("returns null when no config exists", () => {
    const config = resolveDeployConfig(tmpDir);
    expect(config).toBeNull();
  });

  it("resolves from JADE_DEPLOY_CONFIG env var", () => {
    const configPath = join(tmpDir, "custom-deploy.json");
    writeFileSync(configPath, JSON.stringify(MINIMAL_CONFIG));
    process.env["JADE_DEPLOY_CONFIG"] = configPath;

    const config = resolveDeployConfig(tmpDir);
    expect(config).not.toBeNull();
    expect(config!.organization).toBe("Test Corp");
  });

  it("resolves from project-level .jade/deploy.json", () => {
    const jadeDir = join(tmpDir, ".jade");
    mkdirSync(jadeDir, { recursive: true });
    writeFileSync(join(jadeDir, "deploy.json"), JSON.stringify(MINIMAL_CONFIG));

    const config = resolveDeployConfig(tmpDir);
    expect(config).not.toBeNull();
    expect(config!.cloudAuth.provider).toBe("anthropic-direct");
  });

  it("getConfigCandidates returns expected paths", () => {
    const candidates = getConfigCandidates("/project");
    expect(candidates).toContain("/project/.jade/deploy.json");
    expect(candidates.some((c) => c.endsWith(".jade/deploy.json"))).toBe(true);
  });
});

describe("deploy/buildEnvFromConfig", () => {
  it("builds env for anthropic-direct", () => {
    const env = buildEnvFromConfig(MINIMAL_CONFIG);
    expect(env["ANTHROPIC_API_KEY"]).toBe("sk-ant-test-key");
  });

  it("builds env for aws-bedrock", () => {
    const env = buildEnvFromConfig(BEDROCK_CONFIG);
    expect(env["AWS_REGION"]).toBe("us-east-1");
    expect(env["AWS_ACCESS_KEY_ID"]).toBe("AKIATEST");
    expect(env["AWS_SECRET_ACCESS_KEY"]).toBe("secret");
  });

  it("builds env for full config with services", () => {
    const env = buildEnvFromConfig(FULL_CONFIG);
    expect(env["ANTHROPIC_API_KEY"]).toBe("sk-ant-api-key");
    expect(env["ANTHROPIC_ADMIN_KEY"]).toBe("sk-ant-admin01-test");
    expect(env["GITHUB_TOKEN"]).toBe("ghp_test");
    expect(env["SLACK_BOT_TOKEN"]).toBe("xoxb-test");
    expect(env["STRIPE_SECRET_KEY"]).toBe("sk_test_stripe");
    expect(env["NEON_API_KEY"]).toBe("neon-key");
  });

  it("builds OTel env when telemetry enabled", () => {
    const env = buildEnvFromConfig(FULL_CONFIG);
    expect(env["CLAUDE_CODE_ENABLE_TELEMETRY"]).toBe("1");
    expect(env["OTEL_METRICS_EXPORTER"]).toBe("otlp");
    expect(env["OTEL_EXPORTER_OTLP_ENDPOINT"]).toBe("https://otel.example.com:4318");
    expect(env["OTEL_RESOURCE_ATTRIBUTES"]).toBe("team.id=platform");
  });

  it("builds empty env for pro-max", () => {
    const config: DeployConfig = {
      version: "1",
      organization: "Pro Max Corp",
      cloudAuth: { provider: "anthropic-pro-max" },
    };
    const env = buildEnvFromConfig(config);
    expect(Object.keys(env)).toHaveLength(0);
  });
});

describe("deploy/validateDeployConfig", () => {
  it("validates minimal config with no errors", () => {
    const errors = validateDeployConfig(MINIMAL_CONFIG);
    expect(errors).toHaveLength(0);
  });

  it("reports missing version", () => {
    const errors = validateDeployConfig({ organization: "X", cloudAuth: { provider: "anthropic-pro-max" } } as DeployConfig);
    expect(errors.some((e) => e.includes("version"))).toBe(true);
  });

  it("reports missing apiKey for anthropic-direct", () => {
    const config: DeployConfig = {
      version: "1",
      organization: "X",
      cloudAuth: { provider: "anthropic-direct" },
    };
    const errors = validateDeployConfig(config);
    expect(errors.some((e) => e.includes("apiKey"))).toBe(true);
  });

  it("reports missing region for aws-bedrock", () => {
    const config: DeployConfig = {
      version: "1",
      organization: "X",
      cloudAuth: { provider: "aws-bedrock", bedrock: { region: "" } as never },
    };
    const errors = validateDeployConfig(config);
    expect(errors.some((e) => e.includes("region"))).toBe(true);
  });
});
