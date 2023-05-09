module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'import/order': [
      'warn',
      {
        groups: ['external', 'builtin', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '@/**',
            group: 'parent',
          },
          {
            pattern: 'abis/**',
            group: 'parent',
          },
        ],
        pathGroupsExcludedImportTypes: [],
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'import/no-unresolved': 'off',
  },
};
