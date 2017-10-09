module.exports = {
  extends: ["react-tools", "prettier", "prettier/react", "prettier/standard"],
  plugins: ["prettier", "import", "jsx-a11y", "react"],
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es6: true,
    browser: true,
  },
  rules: {
    "react/forbid-prop-types": 0,
    "react/no-array-index-key": 0,
    "react/require-default-props": 0,
  },
};
