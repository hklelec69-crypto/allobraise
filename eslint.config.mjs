// ESLint flat config (v9+). Lint des fichiers JS autonomes uniquement.
// Le JS inline de index.html est validé séparément par
// .github/scripts/check-inline-js.js (parse de chaque <script>).
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'index.html', // monofichier hand-tuned — non lint/format
      'playwright-report/**',
      'test-results/**',
    ],
  },

  js.configs.recommended,

  // Module messagerie (navigateur, IIFE)
  {
    files: ['v5-messagerie.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        supabase: 'readonly',
        sb: 'readonly',
        emailjs: 'readonly',
        currentUser: 'writable',
        toast: 'readonly',
        escHTML: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-empty': 'off', // catch best-effort volontaires
      'no-useless-assignment': 'off', // style existant, non réécrit
    },
  },

  // Service worker (environnement dédié : self, caches, fetch…)
  {
    files: ['sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.serviceworker },
    },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^e$' }] },
  },

  // Tests unitaires Node + scripts CI (CommonJS)
  {
    files: ['test/**/*.js', '.github/scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: { 'no-unused-vars': 'warn' },
  },

  // Tests E2E Playwright (CommonJS) — les callbacks page.evaluate() s'exécutent
  // dans le navigateur, d'où les globals browser en plus de node.
  {
    files: ['tests/e2e/**/*.js', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { 'no-unused-vars': 'warn' },
  },

  // Scripts ESM (audit Lighthouse) + ce fichier de config
  {
    files: ['scripts/**/*.mjs', 'eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: { 'no-unused-vars': 'warn' },
  },
];
