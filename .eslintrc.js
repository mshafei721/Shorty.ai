module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'off',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/__mocks__/*', '**/mocks/*', '**/stubs/*', '**/placeholders/*'],
            message: 'Mock imports are not allowed in production code. Use setM2Gateway() in tests to inject test doubles.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'coverage/',
    '*.config.js',
  ],
};
