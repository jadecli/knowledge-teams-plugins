import { runSkepticalCodegenTeam } from "../src/teams/skeptical-codegen-team.js";

const cwd = process.argv[2] ?? process.cwd();
await runSkepticalCodegenTeam(cwd);
