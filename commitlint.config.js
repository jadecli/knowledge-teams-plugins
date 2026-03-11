/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce Stainless-style conventional commits
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting, no code change
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding or correcting tests
        'build',    // Build system or external dependencies
        'ci',       // CI/CD configuration
        'chore',    // Maintenance tasks
        'revert',   // Revert a previous commit
      ],
    ],
    // Scope must be one of our domains
    'scope-enum': [
      1, // warn (not error) to allow new scopes
      'always',
      [
        'enterprise',
        'admin',
        'deploy',
        'compose',
        'auth',
        'kw',
        'stainless',
        'security',
        'deps',
        'ci',
        'changelog',
        'manifests',
        'jade-cofounder',
        'jade-vp-engineering',
        'jade-vp-security',
        'jade-vp-product',
        'jade-vp-sales',
        'jade-vp-marketing',
        'jade-vp-finance',
        'jade-vp-data',
        'jade-vp-support',
        'jade-vp-legal',
        'jade-vp-search',
        'jade-vp-research',
        'jade-vp-productivity',
        'jade-vp-admin',
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
};
