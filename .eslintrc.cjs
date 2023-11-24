module.exports = {
  extends: [
    'plugin:vue/vue3-essential',
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
    "turbo",
    "prettier",
  ],

  parser: "@typescript-eslint/parser",

  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser",
      // Parse the script in `.svelte` as TypeScript by adding the following configuration.
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  ],

  plugins: ["@typescript-eslint", "prettier"],

  rules: {
    // Note: you must disable the base rule as it can report incorrect errors
    semi: "off",
    quotes: "off",
    "no-undef": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "turbo/no-undeclared-env-vars": "off",
    "prettier/prettier": "error",
  },
}
