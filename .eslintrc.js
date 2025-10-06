module.exports = {
  extends: ['expo', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
    'react-native/react-native': true,
>>>>>>> Stashed changes
=======
    'react-native/react-native': true,
>>>>>>> Stashed changes
    es2021: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
