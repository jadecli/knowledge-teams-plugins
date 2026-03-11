/**
 * @module docs/er/adapter
 * @description Parser and adapter that converts machine-readable ER diagrams
 * into human-readable formats.
 *
 * Design rationale:
 * - Machine-optimized entities.ts is the single source of truth
 * - This adapter derives all human-readable output from that source
 * - You only maintain entities.ts; adapter output is always regenerated
 * - Reduces Bayes probability of hallucination: Claude reads structured
 *   constrained input (enums, flat refs) and produces deterministic output
 *
 * Output formats:
 * 1. Mermaid ER diagram (for GitHub markdown rendering)
 * 2. ASCII table view (for terminal / plain text)
 * 3. Grouped summary (by architectural layer)
 */

import type {
  ERDiagram,
  EREntity,
  ERRelationship,
  ERAttribute,
  ERFunction,
} from "./schema.js";
import {
  Cardinality,
  RelationshipKind,
  EntityLayer,
  AttributeType,
} from "./schema.js";

// ─── Mermaid ER Diagram Adapter ─────────────────────────────────────────────

/** Convert cardinality to Mermaid ER notation */
function mermaidCardinality(c: Cardinality): string {
  switch (c) {
    case Cardinality.ONE_TO_ONE: return "||--||";
    case Cardinality.ONE_TO_MANY: return "||--o{";
    case Cardinality.MANY_TO_ONE: return "}o--||";
    case Cardinality.MANY_TO_MANY: return "}o--o{";
    case Cardinality.ZERO_OR_ONE: return "||--o|";
    case Cardinality.ZERO_OR_MANY: return "||--o{";
  }
}

/** Sanitize entity name for Mermaid (no dots, no spaces) */
function mermaidId(id: string): string {
  return id.replace(/\./g, "_").replace(/[^a-zA-Z0-9_]/g, "_");
}

/** Convert AttributeType to short Mermaid-friendly type label */
function mermaidType(t: AttributeType): string {
  switch (t) {
    case AttributeType.INTEGER: return "int";
    case AttributeType.BIGINT: return "bigint";
    case AttributeType.BOOLEAN: return "bool";
    case AttributeType.TIMESTAMP: return "timestamp";
    case AttributeType.JSONB: return "jsonb";
    case AttributeType.TEXT: return "text";
    case AttributeType.STRING: return "string";
    case AttributeType.ENUM: return "enum";
    case AttributeType.ARRAY: return "array";
    case AttributeType.OBJECT: return "object";
    case AttributeType.FUNCTION: return "fn";
    case AttributeType.UNKNOWN: return "unknown";
  }
}

/** Generate a Mermaid ER diagram string from an ERDiagram */
export function toMermaidER(diagram: ERDiagram): string {
  const lines: string[] = [];
  lines.push("erDiagram");
  lines.push("");

  // Group entities by layer for visual organization
  const byLayer = groupByLayer(diagram.entities);

  for (const [layer, entities] of byLayer) {
    lines.push(`  %% ── ${layer.toUpperCase()} LAYER ──`);
    for (const entity of entities) {
      const eid = mermaidId(entity.id);
      lines.push(`  ${eid} {`);
      for (const attr of entity.attributes) {
        const pk = attr.primaryKey ? "PK" : "";
        const fk = attr.foreignKey ? "FK" : "";
        const marker = pk || fk;
        lines.push(`    ${mermaidType(attr.type)} ${attr.name}${marker ? ` ${marker}` : ""}`);
      }
      lines.push("  }");
      lines.push("");
    }
  }

  // Relationships
  lines.push("  %% ── RELATIONSHIPS ──");
  for (const rel of diagram.relationships) {
    const from = mermaidId(rel.from);
    const to = mermaidId(rel.to);
    const card = mermaidCardinality(rel.cardinality);
    lines.push(`  ${from} ${card} ${to} : "${rel.label}"`);
  }

  return lines.join("\n");
}

// ─── Grouped Mermaid Diagrams (per layer) ───────────────────────────────────

/** Generate separate Mermaid diagrams per architectural layer */
export function toMermaidByLayer(diagram: ERDiagram): Map<EntityLayer, string> {
  const result = new Map<EntityLayer, string>();
  const byLayer = groupByLayer(diagram.entities);

  for (const [layer, entities] of byLayer) {
    const entityIds = new Set(entities.map((e) => e.id));

    // Include relationships where both endpoints are in this layer
    // OR one endpoint is in this layer (cross-layer relationships)
    const layerRels = diagram.relationships.filter(
      (r) => entityIds.has(r.from) || entityIds.has(r.to),
    );

    const subDiagram: ERDiagram = {
      ...diagram,
      title: `${diagram.title} — ${layer} layer`,
      entities,
      relationships: layerRels,
    };

    result.set(layer, toMermaidER(subDiagram));
  }

  return result;
}

// ─── ASCII Table Adapter ────────────────────────────────────────────────────

/** Generate ASCII table representation of an entity */
function entityToAsciiTable(entity: EREntity): string {
  const lines: string[] = [];
  const nameBar = `┌${"─".repeat(62)}┐`;
  const sep = `├${"─".repeat(62)}┤`;
  const bot = `└${"─".repeat(62)}┘`;

  lines.push(nameBar);
  lines.push(`│ ${padRight(`${entity.name} [${entity.layer}]`, 61)}│`);
  lines.push(`│ ${padRight(entity.sourceFile, 61)}│`);
  lines.push(sep);

  // Attributes
  if (entity.attributes.length > 0) {
    lines.push(`│ ${padRight("ATTRIBUTES", 61)}│`);
    lines.push(sep);
    for (const attr of entity.attributes) {
      const flags: string[] = [];
      if (attr.primaryKey) flags.push("PK");
      if (attr.foreignKey) flags.push(`FK→${attr.foreignKey}`);
      if (!attr.required) flags.push("nullable");
      if (attr.defaultValue) flags.push(`default=${attr.defaultValue}`);
      const flagStr = flags.length > 0 ? ` (${flags.join(", ")})` : "";
      const line = `${attr.name}: ${attr.type}${flagStr}`;
      lines.push(`│  ${padRight(line, 60)}│`);
    }
  }

  // Functions
  if (entity.functions && entity.functions.length > 0) {
    lines.push(sep);
    lines.push(`│ ${padRight("FUNCTIONS", 61)}│`);
    lines.push(sep);
    for (const fn of entity.functions) {
      const line = `${fn.name}${fn.params}: ${fn.returnType}`;
      lines.push(`│  ${padRight(line, 60)}│`);
    }
  }

  lines.push(bot);
  return lines.join("\n");
}

function padRight(s: string, len: number): string {
  if (s.length >= len) return s.slice(0, len);
  return s + " ".repeat(len - s.length);
}

/** Generate full ASCII table view of all entities */
export function toAsciiTables(diagram: ERDiagram): string {
  const lines: string[] = [];
  const byLayer = groupByLayer(diagram.entities);

  lines.push(`╔${"═".repeat(64)}╗`);
  lines.push(`║ ${padRight(diagram.title, 63)}║`);
  lines.push(`║ ${padRight(`Generated: ${diagram.generatedAt}`, 63)}║`);
  lines.push(`║ ${padRight(`Source: ${diagram.sourceRef}`, 63)}║`);
  lines.push(`╚${"═".repeat(64)}╝`);
  lines.push("");

  for (const [layer, entities] of byLayer) {
    lines.push(`═══ ${layer.toUpperCase()} LAYER ${"═".repeat(50 - layer.length)}`);
    lines.push("");
    for (const entity of entities) {
      lines.push(entityToAsciiTable(entity));
      lines.push("");
    }
  }

  // Relationships section
  lines.push(`═══ RELATIONSHIPS ${"═".repeat(44)}`);
  lines.push("");
  for (const rel of diagram.relationships) {
    const kindLabel = rel.kind.toUpperCase();
    const card = rel.cardinality;
    lines.push(`  ${rel.from} ──[${kindLabel} ${card}]──▶ ${rel.to}`);
    lines.push(`    ${rel.label}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Grouped Summary Adapter ────────────────────────────────────────────────

export interface LayerSummary {
  layer: EntityLayer;
  entityCount: number;
  entities: Array<{
    id: string;
    name: string;
    attributeCount: number;
    functionCount: number;
    sourceFile: string;
    description: string;
  }>;
  inboundRelationships: number;
  outboundRelationships: number;
}

/** Generate a grouped summary by architectural layer */
export function toLayerSummary(diagram: ERDiagram): LayerSummary[] {
  const byLayer = groupByLayer(diagram.entities);
  const summaries: LayerSummary[] = [];

  for (const [layer, entities] of byLayer) {
    const entityIds = new Set(entities.map((e) => e.id));
    const inbound = diagram.relationships.filter((r) => entityIds.has(r.to) && !entityIds.has(r.from)).length;
    const outbound = diagram.relationships.filter((r) => entityIds.has(r.from) && !entityIds.has(r.to)).length;

    summaries.push({
      layer,
      entityCount: entities.length,
      entities: entities.map((e) => ({
        id: e.id,
        name: e.name,
        attributeCount: e.attributes.length,
        functionCount: e.functions?.length ?? 0,
        sourceFile: e.sourceFile,
        description: e.description,
      })),
      inboundRelationships: inbound,
      outboundRelationships: outbound,
    });
  }

  return summaries;
}

/** Generate human-readable markdown summary */
export function toMarkdownSummary(diagram: ERDiagram): string {
  const lines: string[] = [];
  const summaries = toLayerSummary(diagram);

  lines.push(`# ${diagram.title}`);
  lines.push("");
  lines.push(`> Generated: ${diagram.generatedAt}`);
  lines.push(`> Source: \`${diagram.sourceRef}\``);
  lines.push(`> Schema version: ${diagram.schemaVersion}`);
  lines.push(`> Entities: ${diagram.entities.length} | Relationships: ${diagram.relationships.length}`);
  lines.push("");

  // Table of contents
  lines.push("## Layers");
  lines.push("");
  lines.push("| Layer | Entities | Inbound Rels | Outbound Rels |");
  lines.push("|-------|----------|--------------|---------------|");
  for (const s of summaries) {
    lines.push(`| ${s.layer} | ${s.entityCount} | ${s.inboundRelationships} | ${s.outboundRelationships} |`);
  }
  lines.push("");

  // Per-layer detail
  for (const s of summaries) {
    lines.push(`## ${s.layer.charAt(0).toUpperCase() + s.layer.slice(1)} Layer`);
    lines.push("");
    for (const e of s.entities) {
      lines.push(`### ${e.name}`);
      lines.push("");
      lines.push(`- **ID**: \`${e.id}\``);
      lines.push(`- **Source**: \`${e.sourceFile}\``);
      lines.push(`- **Description**: ${e.description}`);
      lines.push(`- **Attributes**: ${e.attributeCount} | **Functions**: ${e.functionCount}`);
      lines.push("");
    }
  }

  // Relationship table
  lines.push("## Relationships");
  lines.push("");
  lines.push("| From | To | Kind | Cardinality | Label |");
  lines.push("|------|----|------|-------------|-------|");
  for (const rel of diagram.relationships) {
    lines.push(`| \`${rel.from}\` | \`${rel.to}\` | ${rel.kind} | ${rel.cardinality} | ${rel.label} |`);
  }
  lines.push("");

  return lines.join("\n");
}

// ─── Mermaid Markdown (full document with per-layer diagrams) ───────────────

/** Generate a complete markdown document with Mermaid ER diagrams per layer */
export function toMermaidMarkdown(diagram: ERDiagram): string {
  const lines: string[] = [];
  const byLayer = groupByLayer(diagram.entities);

  lines.push(`# ${diagram.title} — Entity Relationship Diagrams`);
  lines.push("");
  lines.push(`> Auto-generated from \`docs/er/entities.ts\` (machine-readable source of truth)`);
  lines.push(`> Generated: ${diagram.generatedAt} | Source: \`${diagram.sourceRef}\``);
  lines.push(`> **Do not edit this file** — edit \`docs/er/entities.ts\` and re-run the adapter.`);
  lines.push("");

  // Full diagram (all entities)
  lines.push("## Complete ER Diagram");
  lines.push("");
  lines.push("```mermaid");
  lines.push(toMermaidER(diagram));
  lines.push("```");
  lines.push("");

  // Per-layer diagrams
  for (const [layer, entities] of byLayer) {
    const entityIds = new Set(entities.map((e) => e.id));
    const layerRels = diagram.relationships.filter(
      (r) => entityIds.has(r.from) || entityIds.has(r.to),
    );

    lines.push(`## ${layer.charAt(0).toUpperCase() + layer.slice(1)} Layer`);
    lines.push("");
    lines.push(`> ${entities.length} entities, ${layerRels.length} relationships`);
    lines.push("");

    // Entity descriptions
    for (const entity of entities) {
      lines.push(`### ${entity.name}`);
      lines.push("");
      lines.push(`\`${entity.id}\` — \`${entity.sourceFile}\``);
      lines.push("");
      lines.push(entity.description);
      lines.push("");

      if (entity.attributes.length > 0) {
        lines.push("| Attribute | Type | Required | Notes |");
        lines.push("|-----------|------|----------|-------|");
        for (const attr of entity.attributes) {
          const notes: string[] = [];
          if (attr.primaryKey) notes.push("PK");
          if (attr.foreignKey) notes.push(`FK→\`${attr.foreignKey}\``);
          if (attr.defaultValue) notes.push(`default: ${attr.defaultValue}`);
          if (attr.enumValues) notes.push(`enum: ${attr.enumValues.join(", ")}`);
          if (attr.description) notes.push(attr.description);
          lines.push(`| ${attr.name} | ${attr.type} | ${attr.required ? "yes" : "no"} | ${notes.join("; ")} |`);
        }
        lines.push("");
      }

      if (entity.functions && entity.functions.length > 0) {
        lines.push("**Functions:**");
        lines.push("");
        for (const fn of entity.functions) {
          lines.push(`- \`${fn.name}${fn.params}\`: \`${fn.returnType}\` — ${fn.description}`);
        }
        lines.push("");
      }
    }

    // Layer Mermaid sub-diagram
    if (layerRels.length > 0) {
      const subDiagram: ERDiagram = {
        ...diagram,
        entities,
        relationships: layerRels,
      };
      lines.push("#### Diagram");
      lines.push("");
      lines.push("```mermaid");
      lines.push(toMermaidER(subDiagram));
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupByLayer(entities: EREntity[]): Map<EntityLayer, EREntity[]> {
  const order: EntityLayer[] = [
    EntityLayer.DATA,
    EntityLayer.TYPE,
    EntityLayer.RUNTIME,
    EntityLayer.AGENT_SDK,
    EntityLayer.INFRA,
    EntityLayer.EXTERNAL,
  ];

  const map = new Map<EntityLayer, EREntity[]>();
  for (const layer of order) {
    const layerEntities = entities.filter((e) => e.layer === layer);
    if (layerEntities.length > 0) {
      map.set(layer, layerEntities);
    }
  }
  return map;
}
