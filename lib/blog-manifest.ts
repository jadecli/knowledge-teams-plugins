/**
 * @module lib/blog-manifest
 * @description Static manifest of Anthropic customer blog post URLs.
 * These are first-party case studies published at claude.com/customers/*.
 *
 * Each entry captures company name, URL slug, and optional tags for
 * downstream classification (industry, product used, integration pattern).
 *
 * MULTI-SIG REQUIREMENT: Changes to this manifest require:
 *   1. PR approved by a human reviewer
 *   2. All CI/CD checks pass
 *   3. Architecture guardrails review passes
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BlogEntry {
  /** Company name (human-readable) */
  company: string;
  /** URL slug on claude.com/customers/ */
  slug: string;
  /** Full URL */
  url: string;
  /** Optional categorization tags */
  tags?: string[];
}

// ─── Manifest ───────────────────────────────────────────────────────────────

/** Base URL for all customer blog posts. */
export const BLOG_BASE_URL = "https://claude.com/customers" as const;

/** Approved domain for blog crawling. */
export const BLOG_DOMAIN = "claude.com" as const;

/**
 * Complete manifest of Anthropic customer case studies.
 * Source: claude.com/customers (188 entries as of 2026-03-11)
 */
export const BLOG_MANIFEST: readonly BlogEntry[] = [
  { company: "Attention", slug: "attention", url: `${BLOG_BASE_URL}/attention`, tags: ["sales", "automation"] },
  { company: "Stripe", slug: "stripe", url: `${BLOG_BASE_URL}/stripe`, tags: ["developer-tools", "enterprise"] },
  { company: "Shortcut", slug: "shortcut", url: `${BLOG_BASE_URL}/shortcut`, tags: ["productivity", "enterprise"] },
  { company: "Athena Intelligence", slug: "athena", url: `${BLOG_BASE_URL}/athena`, tags: ["enterprise", "knowledge-work"] },
  { company: "n8n", slug: "n8n", url: `${BLOG_BASE_URL}/n8n`, tags: ["automation", "workflow"] },
  { company: "Wiz", slug: "wiz", url: `${BLOG_BASE_URL}/wiz`, tags: ["security", "migration"] },
  { company: "Lyft", slug: "lyft", url: `${BLOG_BASE_URL}/lyft`, tags: ["customer-support", "enterprise"] },
  { company: "Pratham International", slug: "pratham-international", url: `${BLOG_BASE_URL}/pratham-international`, tags: ["education", "assessment"] },
  { company: "Adalat AI", slug: "adalat-ai", url: `${BLOG_BASE_URL}/adalat-ai`, tags: ["legal", "government"] },
  { company: "Rocket", slug: "rocket", url: `${BLOG_BASE_URL}/rocket`, tags: ["web-development", "agency"] },
  { company: "Vambe", slug: "vambe", url: `${BLOG_BASE_URL}/vambe`, tags: ["commerce", "latam"] },
  { company: "Mintlify", slug: "mintlify", url: `${BLOG_BASE_URL}/mintlify`, tags: ["documentation", "developer-tools"] },
  { company: "HubSpot", slug: "hubspot", url: `${BLOG_BASE_URL}/hubspot`, tags: ["marketing", "enterprise"] },
  { company: "Figma", slug: "figma", url: `${BLOG_BASE_URL}/figma`, tags: ["design", "product"] },
  { company: "Spotify", slug: "spotify", url: `${BLOG_BASE_URL}/spotify`, tags: ["developer-tools", "migration", "agent-sdk"] },
  { company: "Vibecode", slug: "vibecode", url: `${BLOG_BASE_URL}/vibecode`, tags: ["mobile", "development"] },
  { company: "Freedom Forever", slug: "freedom-forever", url: `${BLOG_BASE_URL}/freedom-forever`, tags: ["automation", "permits"] },
  { company: "Medgate", slug: "medgate", url: `${BLOG_BASE_URL}/medgate`, tags: ["healthcare", "code"] },
  { company: "Gambit Robotics", slug: "gambit", url: `${BLOG_BASE_URL}/gambit`, tags: ["robotics", "real-time"] },
  { company: "Workato", slug: "workato", url: `${BLOG_BASE_URL}/workato`, tags: ["enterprise", "integration"] },
  { company: "Greptile", slug: "greptile", url: `${BLOG_BASE_URL}/greptile`, tags: ["code-review", "agent-sdk"] },
  { company: "Money Forward", slug: "money-forward", url: `${BLOG_BASE_URL}/money-forward`, tags: ["finance", "engineering"] },
  { company: "Carta Healthcare", slug: "carta-healthcare", url: `${BLOG_BASE_URL}/carta-healthcare`, tags: ["healthcare", "data-processing"] },
  { company: "Elation Health", slug: "elation-health", url: `${BLOG_BASE_URL}/elation-health`, tags: ["healthcare", "clinical"] },
  { company: "Qualified Health", slug: "qualified-health", url: `${BLOG_BASE_URL}/qualified-health`, tags: ["healthcare", "university"] },
  { company: "Banner Health", slug: "banner-health", url: `${BLOG_BASE_URL}/banner-health`, tags: ["healthcare", "burnout"] },
  { company: "Base44", slug: "base44", url: `${BLOG_BASE_URL}/base44`, tags: ["no-code", "app-creation"] },
  { company: "Crunched", slug: "crunched", url: `${BLOG_BASE_URL}/crunched`, tags: ["finance", "excel"] },
  { company: "Sett", slug: "sett", url: `${BLOG_BASE_URL}/sett`, tags: ["gaming", "advertising"] },
  { company: "Binti", slug: "binti", url: `${BLOG_BASE_URL}/binti`, tags: ["government", "child-welfare"] },
  { company: "Nevis", slug: "nevis", url: `${BLOG_BASE_URL}/nevis`, tags: ["finance", "advisor"] },
  { company: "Zencoder", slug: "zencoder", url: `${BLOG_BASE_URL}/zencoder`, tags: ["developer-tools", "code-sdk"] },
  { company: "Emergent", slug: "emergent", url: `${BLOG_BASE_URL}/emergent`, tags: ["developer-tools", "agents"] },
  { company: "Parcha", slug: "parcha", url: `${BLOG_BASE_URL}/parcha`, tags: ["compliance", "agent-sdk"] },
  { company: "Shopify", slug: "shopify", url: `${BLOG_BASE_URL}/shopify`, tags: ["commerce", "vertex-ai"] },
  { company: "Matillion", slug: "matillion", url: `${BLOG_BASE_URL}/matillion`, tags: ["data-pipeline", "assistant"] },
  { company: "bunq", slug: "bunq", url: `${BLOG_BASE_URL}/bunq`, tags: ["banking", "assistant"] },
  { company: "Wordsmith", slug: "wordsmith", url: `${BLOG_BASE_URL}/wordsmith`, tags: ["legal", "automation"] },
  { company: "IFS", slug: "ifs", url: `${BLOG_BASE_URL}/ifs`, tags: ["industrial", "ai"] },
  { company: "CodeWords", slug: "codewords", url: `${BLOG_BASE_URL}/codewords`, tags: ["automation", "no-code"] },
  { company: "Doctolib", slug: "doctolib", url: `${BLOG_BASE_URL}/doctolib`, tags: ["healthcare", "developer-productivity"] },
  { company: "N26", slug: "n26", url: `${BLOG_BASE_URL}/n26`, tags: ["banking", "customer-support"] },
  { company: "L'Oréal", slug: "loreal", url: `${BLOG_BASE_URL}/loreal`, tags: ["retail", "analytics"] },
  { company: "Chronograph", slug: "chronograph", url: `${BLOG_BASE_URL}/chronograph`, tags: ["finance", "decision-making"] },
  { company: "Hostinger", slug: "hostinger", url: `${BLOG_BASE_URL}/hostinger`, tags: ["hosting", "website-builder"] },
  { company: "Classmethod", slug: "classmethod", url: `${BLOG_BASE_URL}/classmethod`, tags: ["consulting", "development"] },
  { company: "Novo Nordisk", slug: "novo-nordisk", url: `${BLOG_BASE_URL}/novo-nordisk`, tags: ["pharma", "clinical"] },
  { company: "JetBrains (Multi-Agent)", slug: "jetbrains-2", url: `${BLOG_BASE_URL}/jetbrains-2`, tags: ["ide", "multi-agent"] },
  { company: "NBIM", slug: "nbim", url: `${BLOG_BASE_URL}/nbim`, tags: ["sovereign-wealth", "enterprise"] },
  { company: "Pelanor", slug: "pelanor", url: `${BLOG_BASE_URL}/pelanor`, tags: ["cloud", "cost-management"] },
  { company: "Qodo", slug: "qodo", url: `${BLOG_BASE_URL}/qodo`, tags: ["developer-tools", "code-quality"] },
  { company: "Fountain", slug: "fountain", url: `${BLOG_BASE_URL}/fountain`, tags: ["hr", "hiring"] },
  { company: "Spring.new", slug: "spring-new", url: `${BLOG_BASE_URL}/spring-new`, tags: ["development", "vertex-ai"] },
  { company: "ChatAndBuild", slug: "chatandbuild", url: `${BLOG_BASE_URL}/chatandbuild`, tags: ["development", "global"] },
  { company: "TELUS", slug: "telus", url: `${BLOG_BASE_URL}/telus`, tags: ["telecom", "enterprise"] },
  { company: "Charm Industrial", slug: "charm-industrial", url: `${BLOG_BASE_URL}/charm-industrial`, tags: ["carbon", "climate"] },
  { company: "CRED", slug: "cred", url: `${BLOG_BASE_URL}/cred`, tags: ["fintech", "development"] },
  { company: "Lindy", slug: "lindy", url: `${BLOG_BASE_URL}/lindy`, tags: ["agents", "automation"] },
  { company: "RileyBot", slug: "rileybot", url: `${BLOG_BASE_URL}/rileybot`, tags: ["education", "safety"] },
  { company: "Gradient Labs", slug: "gradient-labs", url: `${BLOG_BASE_URL}/gradient-labs`, tags: ["finance", "customer-support"] },
  { company: "Circleback", slug: "circleback", url: `${BLOG_BASE_URL}/circleback`, tags: ["meetings", "insights"] },
  { company: "Tines", slug: "tines", url: `${BLOG_BASE_URL}/tines`, tags: ["automation", "bedrock"] },
  { company: "StubHub", slug: "stubhub", url: `${BLOG_BASE_URL}/stubhub`, tags: ["ticketing", "events"] },
  { company: "Windsurf", slug: "windsurf", url: `${BLOG_BASE_URL}/windsurf`, tags: ["ide", "agents"] },
  { company: "Zapier", slug: "zapier", url: `${BLOG_BASE_URL}/zapier`, tags: ["automation", "enterprise"] },
  { company: "Tahoe Lead Removal", slug: "tahoe-lead-removal-project", url: `${BLOG_BASE_URL}/tahoe-lead-removal-project`, tags: ["environment", "nonprofit"] },
  { company: "eSentire", slug: "esentire", url: `${BLOG_BASE_URL}/esentire`, tags: ["security", "bedrock"] },
  { company: "Legora", slug: "legora", url: `${BLOG_BASE_URL}/legora`, tags: ["legal", "efficiency"] },
  { company: "Grafana", slug: "grafana", url: `${BLOG_BASE_URL}/grafana`, tags: ["observability", "multi-agent"] },
  { company: "Dust", slug: "dust", url: `${BLOG_BASE_URL}/dust`, tags: ["enterprise", "mcp", "agents"] },
  { company: "ClassDojo", slug: "classdojo", url: `${BLOG_BASE_URL}/classdojo`, tags: ["education", "teachers"] },
  { company: "Biomni", slug: "biomni", url: `${BLOG_BASE_URL}/biomni`, tags: ["biomedical", "research"] },
  { company: "Audience Strategies", slug: "audience-strategies", url: `${BLOG_BASE_URL}/audience-strategies`, tags: ["music", "policy"] },
  { company: "Dolly", slug: "dolly", url: `${BLOG_BASE_URL}/dolly`, tags: ["education", "bedrock"] },
  { company: "cubic", slug: "cubic", url: `${BLOG_BASE_URL}/cubic`, tags: ["development", "speed"] },
  { company: "Rakuten", slug: "rakuten", url: `${BLOG_BASE_URL}/rakuten`, tags: ["commerce", "development"] },
  { company: "Brex", slug: "brex", url: `${BLOG_BASE_URL}/brex`, tags: ["fintech", "bedrock"] },
  { company: "Patrick J. McGovern Foundation", slug: "pjmf", url: `${BLOG_BASE_URL}/pjmf`, tags: ["nonprofit", "grants"] },
  { company: "Harvey", slug: "harvey", url: `${BLOG_BASE_URL}/harvey`, tags: ["legal", "enterprise"] },
  { company: "Grab", slug: "grab", url: `${BLOG_BASE_URL}/grab`, tags: ["commerce", "southeast-asia"] },
  { company: "Solvely.ai", slug: "solvely", url: `${BLOG_BASE_URL}/solvely`, tags: ["education", "global"] },
  { company: "Apollo", slug: "apollo", url: `${BLOG_BASE_URL}/apollo`, tags: ["sales", "outbound"] },
  { company: "TRY", slug: "try", url: `${BLOG_BASE_URL}/try`, tags: ["creative", "agency"] },
  { company: "Genspark", slug: "genspark", url: `${BLOG_BASE_URL}/genspark`, tags: ["search", "agents"] },
  { company: "NRI", slug: "nri", url: `${BLOG_BASE_URL}/nri`, tags: ["consulting", "bedrock"] },
  { company: "Amira", slug: "amira", url: `${BLOG_BASE_URL}/amira`, tags: ["education", "reading"] },
  { company: "Bluenote", slug: "bluenote", url: `${BLOG_BASE_URL}/bluenote`, tags: ["life-sciences", "agents"] },
  { company: "JetBrains", slug: "jetbrains", url: `${BLOG_BASE_URL}/jetbrains`, tags: ["ide", "bedrock"] },
  { company: "Sendbird", slug: "sendbird", url: `${BLOG_BASE_URL}/sendbird`, tags: ["customer-support", "enterprise"] },
  { company: "Vanta", slug: "vanta", url: `${BLOG_BASE_URL}/vanta`, tags: ["compliance", "remediation"] },
  { company: "Benchling", slug: "benchling", url: `${BLOG_BASE_URL}/benchling`, tags: ["biotech", "bedrock"] },
  { company: "Triple Whale", slug: "triple-whale", url: `${BLOG_BASE_URL}/triple-whale`, tags: ["ecommerce", "analytics"] },
  { company: "FutureHouse", slug: "futurehouse", url: `${BLOG_BASE_URL}/futurehouse`, tags: ["science", "agents"] },
  { company: "Ramp", slug: "ramp", url: `${BLOG_BASE_URL}/ramp`, tags: ["fintech", "engineering"] },
  { company: "Lotte Homeshopping", slug: "lotte-homeshopping", url: `${BLOG_BASE_URL}/lotte-homeshopping`, tags: ["retail", "korea"] },
  { company: "Lokalise", slug: "lokalise", url: `${BLOG_BASE_URL}/lokalise`, tags: ["localization", "translation"] },
  { company: "IG Group", slug: "ig-group", url: `${BLOG_BASE_URL}/ig-group`, tags: ["finance", "enterprise"] },
  { company: "Trellix", slug: "trellix", url: `${BLOG_BASE_URL}/trellix`, tags: ["security", "bedrock", "agents"] },
  { company: "Panther", slug: "panther", url: `${BLOG_BASE_URL}/panther`, tags: ["security", "bedrock"] },
  { company: "Panorama", slug: "panorama", url: `${BLOG_BASE_URL}/panorama`, tags: ["education", "bedrock"] },
  { company: "Semgrep", slug: "semgrep", url: `${BLOG_BASE_URL}/semgrep`, tags: ["security", "code", "bedrock"] },
  { company: "Cox Automotive", slug: "cox-automotive", url: `${BLOG_BASE_URL}/cox-automotive`, tags: ["automotive", "bedrock"] },
  { company: "Quillit", slug: "quillit", url: `${BLOG_BASE_URL}/quillit`, tags: ["research", "qualitative"] },
  { company: "Block", slug: "block", url: `${BLOG_BASE_URL}/block`, tags: ["fintech", "databricks"] },
  { company: "Quantium", slug: "quantium", url: `${BLOG_BASE_URL}/quantium`, tags: ["analytics", "enterprise"] },
  { company: "Canva", slug: "canva", url: `${BLOG_BASE_URL}/canva`, tags: ["design", "enterprise"] },
  { company: "Rising Academies", slug: "rising-academies", url: `${BLOG_BASE_URL}/rising-academies`, tags: ["education", "africa"] },
  { company: "Tidio", slug: "tidio", url: `${BLOG_BASE_URL}/tidio`, tags: ["customer-support", "automation"] },
  { company: "Chatbase", slug: "chatbase", url: `${BLOG_BASE_URL}/chatbase`, tags: ["customer-support", "chatbot"] },
  { company: "Lovable", slug: "lovable", url: `${BLOG_BASE_URL}/lovable`, tags: ["development", "no-code"] },
  { company: "Pensive", slug: "pensive", url: `${BLOG_BASE_URL}/pensive`, tags: ["education", "higher-ed"] },
  { company: "Super Teacher", slug: "super-teacher", url: `${BLOG_BASE_URL}/super-teacher`, tags: ["education", "k12"] },
  { company: "Sentry", slug: "sentry", url: `${BLOG_BASE_URL}/sentry`, tags: ["developer-tools", "debugging"] },
  { company: "Bito", slug: "bito", url: `${BLOG_BASE_URL}/bito`, tags: ["developer-tools", "agents"] },
  { company: "Augment", slug: "augment", url: `${BLOG_BASE_URL}/augment`, tags: ["developer-tools", "vertex-ai"] },
  { company: "Praxis AI", slug: "praxis-ai", url: `${BLOG_BASE_URL}/praxis-ai`, tags: ["education", "bedrock"] },
  { company: "Aura Intelligence", slug: "aura-intelligence", url: `${BLOG_BASE_URL}/aura-intelligence`, tags: ["analytics", "bedrock"] },
  { company: "SK Telecom", slug: "sk-telecom", url: `${BLOG_BASE_URL}/sk-telecom`, tags: ["telecom", "bedrock", "korea"] },
  { company: "Section", slug: "section", url: `${BLOG_BASE_URL}/section`, tags: ["consulting", "transformation"] },
  { company: "Amazon Alexa", slug: "amazon-alexa", url: `${BLOG_BASE_URL}/amazon-alexa`, tags: ["voice", "consumer"] },
  { company: "Orange", slug: "orange", url: `${BLOG_BASE_URL}/orange`, tags: ["media", "localization"] },
  { company: "LaunchNotes", slug: "launchnotes", url: `${BLOG_BASE_URL}/launchnotes`, tags: ["product", "bedrock"] },
  { company: "Replit", slug: "replit", url: `${BLOG_BASE_URL}/replit`, tags: ["development", "vertex-ai"] },
  { company: "Campfire", slug: "campfire", url: `${BLOG_BASE_URL}/campfire`, tags: ["accounting", "finance"] },
  { company: "Snowflake", slug: "snowflake", url: `${BLOG_BASE_URL}/snowflake`, tags: ["data", "enterprise"] },
  { company: "Amazon Q", slug: "amazon-q", url: `${BLOG_BASE_URL}/amazon-q`, tags: ["customer-support", "aws"] },
  { company: "micro1", slug: "micro1", url: `${BLOG_BASE_URL}/micro1`, tags: ["recruiting", "hr"] },
  { company: "Thomson Reuters", slug: "thomson-reuters", url: `${BLOG_BASE_URL}/thomson-reuters`, tags: ["legal", "bedrock"] },
  { company: "Advolve", slug: "advolve", url: `${BLOG_BASE_URL}/advolve`, tags: ["marketing", "automation"] },
  { company: "Kodif", slug: "kodif", url: `${BLOG_BASE_URL}/kodif`, tags: ["customer-support", "bedrock"] },
  { company: "AppFolio", slug: "appfolio", url: `${BLOG_BASE_URL}/appfolio`, tags: ["property", "bedrock"] },
  { company: "Law&Company", slug: "law-and-company", url: `${BLOG_BASE_URL}/law-and-company`, tags: ["legal", "korea"] },
  { company: "Assembled", slug: "assembled", url: `${BLOG_BASE_URL}/assembled`, tags: ["customer-support", "operations"] },
  { company: "University of Sydney", slug: "university-of-sydney", url: `${BLOG_BASE_URL}/university-of-sydney`, tags: ["conservation", "research"] },
  { company: "Brand.ai", slug: "brand-ai", url: `${BLOG_BASE_URL}/brand-ai`, tags: ["branding", "ai"] },
  { company: "Stairwell", slug: "stairwell", url: `${BLOG_BASE_URL}/stairwell`, tags: ["security", "cybersecurity"] },
  { company: "Skillfully", slug: "skillfully", url: `${BLOG_BASE_URL}/skillfully`, tags: ["hr", "assessment"] },
  { company: "Newfront", slug: "newfront", url: `${BLOG_BASE_URL}/newfront`, tags: ["insurance", "enterprise"] },
  { company: "CodeRabbit", slug: "coderabbit", url: `${BLOG_BASE_URL}/coderabbit`, tags: ["code-review", "developer-tools"] },
  { company: "tl;dv", slug: "tldv", url: `${BLOG_BASE_URL}/tldv`, tags: ["meetings", "revenue"] },
  { company: "Otter", slug: "otter", url: `${BLOG_BASE_URL}/otter`, tags: ["meetings", "knowledge"] },
  { company: "Palo Alto Networks", slug: "palo-alto-networks", url: `${BLOG_BASE_URL}/palo-alto-networks`, tags: ["security", "vertex-ai"] },
  { company: "Graphite", slug: "graphite", url: `${BLOG_BASE_URL}/graphite`, tags: ["code-review", "developer-tools"] },
  { company: "Intercom", slug: "intercom", url: `${BLOG_BASE_URL}/intercom`, tags: ["customer-support", "enterprise"] },
  { company: "StudyFetch", slug: "studyfetch", url: `${BLOG_BASE_URL}/studyfetch`, tags: ["education", "personalized"] },
  { company: "Humach", slug: "humach", url: `${BLOG_BASE_URL}/humach`, tags: ["customer-support", "cx"] },
  { company: "Hume AI", slug: "hume", url: `${BLOG_BASE_URL}/hume`, tags: ["voice", "emotion"] },
  { company: "AES", slug: "aes", url: `${BLOG_BASE_URL}/aes`, tags: ["energy", "vertex-ai"] },
  { company: "Local Falcon", slug: "local-falcon", url: `${BLOG_BASE_URL}/local-falcon`, tags: ["seo", "local-business"] },
  { company: "Lazy AI", slug: "lazy-ai", url: `${BLOG_BASE_URL}/lazy-ai`, tags: ["development", "internal-tools"] },
  { company: "StackBlitz", slug: "stackblitz", url: `${BLOG_BASE_URL}/stackblitz`, tags: ["development", "web"] },
  { company: "Coinbase", slug: "coinbase", url: `${BLOG_BASE_URL}/coinbase`, tags: ["crypto", "customer-support"] },
  { company: "Asana", slug: "asana", url: `${BLOG_BASE_URL}/asana`, tags: ["productivity", "enterprise"] },
  { company: "ASAPP", slug: "asapp", url: `${BLOG_BASE_URL}/asapp`, tags: ["customer-support", "enterprise"] },
  { company: "Braintrust", slug: "braintrust", url: `${BLOG_BASE_URL}/braintrust`, tags: ["recruiting", "talent"] },
  { company: "Hebbia", slug: "hebbia", url: `${BLOG_BASE_URL}/hebbia`, tags: ["knowledge-work", "enterprise"] },
  { company: "Tabnine", slug: "tabnine", url: `${BLOG_BASE_URL}/tabnine`, tags: ["developer-tools", "code-completion"] },
  { company: "You.com", slug: "you-dot-com", url: `${BLOG_BASE_URL}/you-dot-com`, tags: ["search", "productivity"] },
  { company: "BlueFlame AI", slug: "blueflame", url: `${BLOG_BASE_URL}/blueflame`, tags: ["finance", "investment"] },
  { company: "Inscribe", slug: "inscribe", url: `${BLOG_BASE_URL}/inscribe`, tags: ["fraud", "fintech"] },
  { company: "WRTN", slug: "wrtn", url: `${BLOG_BASE_URL}/wrtn`, tags: ["entertainment", "asia"] },
  { company: "Decagon", slug: "decagon", url: `${BLOG_BASE_URL}/decagon`, tags: ["customer-support", "enterprise"] },
  { company: "Notion", slug: "notion", url: `${BLOG_BASE_URL}/notion`, tags: ["productivity", "knowledge-work"] },
  { company: "MagicSchool", slug: "magicschool", url: `${BLOG_BASE_URL}/magicschool`, tags: ["education", "k12"] },
  { company: "Zapia", slug: "zapia", url: `${BLOG_BASE_URL}/zapia`, tags: ["commerce", "latam", "vertex-ai"] },
  { company: "Zoom", slug: "zoom", url: `${BLOG_BASE_URL}/zoom`, tags: ["meetings", "enterprise"] },
  { company: "Tome", slug: "tome", url: `${BLOG_BASE_URL}/tome`, tags: ["sales", "insights"] },
  { company: "Cove", slug: "cove", url: `${BLOG_BASE_URL}/cove`, tags: ["collaboration", "visual"] },
  { company: "Headstart", slug: "headstart", url: `${BLOG_BASE_URL}/headstart`, tags: ["development", "speed"] },
  { company: "Gumroad", slug: "gumroad", url: `${BLOG_BASE_URL}/gumroad`, tags: ["commerce", "customer-support"] },
  { company: "GitLab", slug: "gitlab", url: `${BLOG_BASE_URL}/gitlab`, tags: ["developer-tools", "enterprise"] },
  { company: "Armanino", slug: "armanino", url: `${BLOG_BASE_URL}/armanino`, tags: ["accounting", "finance"] },
  { company: "Lex", slug: "lex", url: `${BLOG_BASE_URL}/lex`, tags: ["writing", "productivity"] },
  { company: "GitLab Enterprise", slug: "gitlab-enterprise", url: `${BLOG_BASE_URL}/gitlab-enterprise`, tags: ["developer-tools", "enterprise"] },
  { company: "Sourcegraph (Claude for Work)", slug: "sourcegraph-claude-for-work", url: `${BLOG_BASE_URL}/sourcegraph-claude-for-work`, tags: ["developer-tools", "insights"] },
  { company: "Sourcegraph", slug: "sourcegraph", url: `${BLOG_BASE_URL}/sourcegraph`, tags: ["developer-tools", "code-search"] },
  { company: "Wedia Group", slug: "wedia-group", url: `${BLOG_BASE_URL}/wedia-group`, tags: ["media", "dam"] },
  { company: "Pulpit AI", slug: "pulpit-ai", url: `${BLOG_BASE_URL}/pulpit-ai`, tags: ["content", "religious"] },
  { company: "Intuit", slug: "intuit", url: `${BLOG_BASE_URL}/intuit`, tags: ["tax", "finance"] },
  { company: "Scribd", slug: "scribd", url: `${BLOG_BASE_URL}/scribd`, tags: ["content", "discovery"] },
  { company: "Copy.ai", slug: "copy-ai", url: `${BLOG_BASE_URL}/copy-ai`, tags: ["content", "marketing"] },
  { company: "Steno", slug: "steno", url: `${BLOG_BASE_URL}/steno`, tags: ["legal", "transcription"] },
  { company: "Jumpcut", slug: "jumpcut", url: `${BLOG_BASE_URL}/jumpcut`, tags: ["entertainment", "scripts"] },
  { company: "Clay", slug: "clay", url: `${BLOG_BASE_URL}/clay`, tags: ["sales", "outreach"] },
  { company: "Gamma", slug: "gamma", url: `${BLOG_BASE_URL}/gamma`, tags: ["presentations", "productivity"] },
  { company: "Factory", slug: "factory", url: `${BLOG_BASE_URL}/factory`, tags: ["developer-tools", "agents"] },
  { company: "Brian Impact Foundation", slug: "brian-impact-foundation", url: `${BLOG_BASE_URL}/brian-impact-foundation`, tags: ["nonprofit", "social-innovation"] },
] as const;

/** Total number of customer blog posts in the manifest. */
export const BLOG_COUNT = BLOG_MANIFEST.length;

/** Get all blog URLs as a flat array. */
export function getBlogUrls(): string[] {
  return BLOG_MANIFEST.map((entry) => entry.url);
}

/** Get blog entries filtered by tag. */
export function getBlogsByTag(tag: string): readonly BlogEntry[] {
  return BLOG_MANIFEST.filter((entry) => entry.tags?.includes(tag));
}

/** Get a blog entry by slug. */
export function getBlogBySlug(slug: string): BlogEntry | undefined {
  return BLOG_MANIFEST.find((entry) => entry.slug === slug);
}
