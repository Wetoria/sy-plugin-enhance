module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    'plugin:vue/vue3-essential',
    "plugin:@typescript-eslint/recommended",
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
    "turbo",
    "prettier",
  ],

  parser: "@typescript-eslint/parser",

  overrides: [
  ],

  plugins: [
    "vue",
    "@typescript-eslint",
    // "prettier",
  ],

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
    "vue/max-attributes-per-line": ["error", {
      "singleline": 1, // 单行元素每个属性都要放在新行
      "multiline": {
        "max": 1, // 多行元素每个属性都要放在新行
        "allowFirstLine": false // 不允许在第一行写属性
      }
    }]
  },
}
