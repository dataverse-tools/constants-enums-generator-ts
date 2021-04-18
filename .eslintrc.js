module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "plugin:jsdoc/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    ecmaVersion: 2020,
    sourceType: "module"
  },
  rules: {
    "jsdoc/require-jsdoc": "off",
    "no-case-declarations": "off",
    "@typescript-eslint/no-use-before-define": [
      "error",
      {
        "functions": false,
        "classes": true
      }
    ]
  }
}
