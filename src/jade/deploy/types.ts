/**
 * Customer deployment configuration types.
 *
 * This file defines the shape of a customer's deployment config.
 * The config file itself is NEVER committed to the repo — it's generated
 * at install time and lives at:
 *   - ~/.jade/deploy.json          (user-level)
 *   - /etc/jade/deploy.json        (system-level, MDM-deployed)
 *   - $JADE_DEPLOY_CONFIG          (env override)
 *
 * The repo stays stateless. Customer state lives on their infrastructure.
 */

/** Cloud provider authentication */
export interface CloudAuth {
  /** Which provider to use */
  readonly provider: "anthropic-direct" | "anthropic-pro-max" | "aws-bedrock" | "gcp-vertex";
  /** API key for direct Anthropic access */
  readonly apiKey?: string;
  /** AWS Bedrock configuration */
  readonly bedrock?: {
    readonly region: string;
    readonly accessKeyId?: string;
    readonly secretAccessKey?: string;
    readonly sessionToken?: string;
    readonly modelId?: string;
  };
  /** GCP Vertex configuration */
  readonly vertex?: {
    readonly projectId: string;
    readonly region: string;
    readonly credentialsPath?: string;
  };
}

/** Anthropic Admin API credentials */
export interface AdminAuth {
  /** Admin API key (sk-ant-admin...) */
  readonly adminApiKey: string;
  /** Organization ID */
  readonly organizationId?: string;
}

/** Third-party service credentials */
export interface ServiceCredentials {
  readonly github?: { readonly token: string };
  readonly slack?: { readonly botToken: string; readonly teamId: string };
  readonly stripe?: { readonly secretKey: string };
  readonly neon?: { readonly apiKey: string };
  readonly vercel?: { readonly token: string; readonly teamId?: string };
}

/** SSO/identity configuration */
export interface IdentityConfig {
  readonly ssoProvider?: "okta" | "azure-ad" | "google-workspace" | "saml-generic";
  readonly ssoEntityId?: string;
  readonly scimEndpoint?: string;
  readonly scimBearerToken?: string;
  readonly domainCapture?: readonly string[];
}

/** OpenTelemetry export configuration */
export interface TelemetryExportConfig {
  readonly enabled: boolean;
  readonly endpoint: string;
  readonly exporter: "otlp" | "prometheus" | "console";
  readonly headers?: Record<string, string>;
  readonly resourceAttributes?: Record<string, string>;
}

/** The full customer deployment configuration */
export interface DeployConfig {
  readonly $schema?: string;
  readonly version: "1";
  /** Customer display name */
  readonly organization: string;
  /** Claude API auth (how to reach the model) */
  readonly cloudAuth: CloudAuth;
  /** Anthropic Admin API auth (for org management) */
  readonly adminAuth?: AdminAuth;
  /** Third-party service credentials */
  readonly services?: ServiceCredentials;
  /** SSO / identity */
  readonly identity?: IdentityConfig;
  /** Telemetry export */
  readonly telemetry?: TelemetryExportConfig;
  /** Claude Code managed settings overrides */
  readonly managedSettings?: {
    /** Where to write the managed-settings.json */
    readonly deployPath?: string;
    /** Lock down bypass mode */
    readonly disableBypassPermissions?: boolean;
    /** Additional permission allow rules */
    readonly additionalAllowRules?: readonly string[];
    /** Additional permission deny rules */
    readonly additionalDenyRules?: readonly string[];
  };
}
