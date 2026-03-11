/**
 * @module docs/er/schema
 * @description Machine-readable entity relationship diagram schema.
 *
 * Optimized for Claude AI structured input/output:
 * - Deterministic field ordering reduces token variance
 * - Enum-constrained values act as guardrails against hallucination
 * - Flat references (string IDs) instead of nested objects reduce Bayes error
 * - Each entity has a canonical ID for cross-referencing
 *
 * The schema is the single source of truth. Human-readable diagrams
 * are derived from this via the adapter (docs/er/adapter.ts).
 */

// ─── Cardinality ────────────────────────────────────────────────────────────

export enum Cardinality {
  ONE_TO_ONE = "1:1",
  ONE_TO_MANY = "1:N",
  MANY_TO_ONE = "N:1",
  MANY_TO_MANY = "N:N",
  ZERO_OR_ONE = "0..1",
  ZERO_OR_MANY = "0..N",
}

// ─── Relationship Kind ──────────────────────────────────────────────────────

export enum RelationshipKind {
  /** Foreign key / direct reference */
  REFERENCES = "references",
  /** Composition — child cannot exist without parent */
  COMPOSES = "composes",
  /** Aggregation — child can exist independently */
  AGGREGATES = "aggregates",
  /** Extends / inherits from */
  EXTENDS = "extends",
  /** Implements interface */
  IMPLEMENTS = "implements",
  /** Uses at runtime (import dependency) */
  USES = "uses",
  /** Produces / emits data consumed by another entity */
  PRODUCES = "produces",
  /** Consumes data produced by another entity */
  CONSUMES = "consumes",
}

// ─── Entity Layer ───────────────────────────────────────────────────────────

export enum EntityLayer {
  /** Database tables (Drizzle/Postgres) */
  DATA = "data",
  /** TypeScript interfaces and types */
  TYPE = "type",
  /** Runtime modules and functions */
  RUNTIME = "runtime",
  /** CI/CD workflows and infrastructure */
  INFRA = "infra",
  /** External APIs and services */
  EXTERNAL = "external",
  /** Claude Agent SDK entities */
  AGENT_SDK = "agent-sdk",
}

// ─── Attribute Type ─────────────────────────────────────────────────────────

export enum AttributeType {
  STRING = "string",
  INTEGER = "integer",
  BIGINT = "bigint",
  BOOLEAN = "boolean",
  TIMESTAMP = "timestamp",
  JSONB = "jsonb",
  TEXT = "text",
  ENUM = "enum",
  ARRAY = "array",
  OBJECT = "object",
  FUNCTION = "function",
  UNKNOWN = "unknown",
}

// ─── Core Schema Types ──────────────────────────────────────────────────────

export interface ERAttribute {
  /** Attribute name */
  name: string;
  /** Data type */
  type: AttributeType;
  /** Whether this attribute is required */
  required: boolean;
  /** Whether this is a primary key */
  primaryKey?: boolean;
  /** Whether this is a foreign key */
  foreignKey?: string;
  /** Default value expression */
  defaultValue?: string;
  /** Enum values if type is ENUM */
  enumValues?: string[];
  /** Brief description */
  description?: string;
}

export interface EREntity {
  /** Canonical identifier (e.g., "db.dim_tools", "type.McpServerEntry") */
  id: string;
  /** Display name */
  name: string;
  /** Which architectural layer */
  layer: EntityLayer;
  /** Source file path */
  sourceFile: string;
  /** Brief description */
  description: string;
  /** Ordered list of attributes */
  attributes: ERAttribute[];
  /** Exported functions associated with this entity */
  functions?: ERFunction[];
}

export interface ERFunction {
  /** Function name */
  name: string;
  /** Parameter signatures */
  params: string;
  /** Return type */
  returnType: string;
  /** Brief description */
  description: string;
}

export interface ERRelationship {
  /** Canonical ID for this relationship */
  id: string;
  /** Source entity ID */
  from: string;
  /** Target entity ID */
  to: string;
  /** Relationship kind */
  kind: RelationshipKind;
  /** Cardinality from source perspective */
  cardinality: Cardinality;
  /** Label describing the relationship */
  label: string;
  /** The attribute on `from` that references `to` (if applicable) */
  throughAttribute?: string;
}

export interface ERDiagram {
  /** Schema version for forward compatibility */
  schemaVersion: number;
  /** ISO 8601 generation timestamp */
  generatedAt: string;
  /** Source branch/commit */
  sourceRef: string;
  /** Human-readable title */
  title: string;
  /** All entities in this diagram */
  entities: EREntity[];
  /** All relationships in this diagram */
  relationships: ERRelationship[];
}
