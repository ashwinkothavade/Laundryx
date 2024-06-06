module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended', // adding it at last to override other configs
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    'react/react-in-jsx-scope': 0,
    'react-hooks/exhaustive-deps': 0,
    'react/no-unescaped-entities': 'off',
    'react/require-default-props': 'off',
    'react/no-array-index-key': 0,
    'react/destructuring-assignment': 0,
    'no-console': 0,
    camelcase: 0,
    'no-alert': 0,
    'react/button-has-type': 0,
    'no-underscore-dangle': 0,
    'no-nested-ternary': 0,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
