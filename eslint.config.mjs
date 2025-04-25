import antfu from '@antfu/eslint-config'
import perfectionist from 'eslint-plugin-perfectionist'
import i18nPlugin from './src/utils/eslint/i18n-validate-keys.mjs'

export default antfu(
  {
    type: 'lib',
    stylistic: {
      indent: 2, // 4, or 'tab'
      quotes: 'single', // or 'double'
    },

    vue: true,
    typescript: true,

    formatters: true,

    ignores: [
      'dist',
      'node_modules',
      'src/abandon',
      'src/components/FixedDocArea.vue',
      'src/modules/Test/*',
      'src/utils/Siyuan/*',
      'src/index.ts',

      'src/**/*.test.*',
    ],
  },
  {
    files: [
      'src/**/*.vue',
    ],
    rules: {
    },
  },
  {
    files: [
      'src/**/*.ts',
    ],
    rules: {
    },
  },
  // INFO 国际化以及枚举常量中的字段顺序
  {
    files: [
      'src/i18n/*.json',
      'src/i18n/types.d.ts',
      'src/utils/Constants.ts',
    ],
    plugins: {
      i18n: i18nPlugin,
      perfectionist,
    },
    rules: {
      'i18n/validate-keys': 'error',
      'perfectionist/sort-enums': 'error',
      'perfectionist/sort-interfaces': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc',
          ignoreCase: true,
          specialCharacters: 'keep',
          ignorePattern: [],
          partitionByComment: false,
          partitionByNewLine: false,
          newlinesBetween: 'ignore',
          groupKind: 'mixed',
          groups: [],
          customGroups: {},
        },
      ],
      'perfectionist/sort-objects': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc',
          ignoreCase: true,
          specialCharacters: 'keep',
          partitionByComment: false,
          partitionByNewLine: false,
          newlinesBetween: 'ignore',
          styledComponents: true,
          ignorePattern: [],
          groups: [],
          customGroups: {},
        },
      ],
    },
  },
  // INFO 一些通用规则
  {
    rules: {
      'antfu/top-level-function': 'off',
      'antfu/if-newline': 'off',

      'eqeqeq': 'off',

      'no-console': 'off',
      'no-empty': 'off',

      'object-curly-newline': ['error', {
        multiline: true,
        minProperties: 2,
        consistent: true,
      }],
      'object-property-newline': ['error', {
        allowAllPropertiesOnSameLine: false,
      }],

      'style/arrow-parens': ['warn', 'always'],
      'style/brace-style': 'off',
      'style/no-multiple-empty-lines': ['warn', {
        max: 7,
      }],
      'style/operator-linebreak': ['warn', 'before', {
        overrides: {
          '=': 'ignore',
        },
      }],
      'style/padded-blocks': 'off',
      'style/quotes': 'off',

      'ts/consistent-type-imports': 'off',
      'ts/explicit-function-return-type': 'off',
      'ts/no-require-imports': 'off',
      'ts/no-use-before-define': ['warn', {
        functions: 'allow',
      }],
      'ts/prefer-literal-enum-member': 'off',
      'ts/strict-boolean-expressions': 'off',

      'unused-imports/no-unused-vars': 'warn',
      'unused-imports/no-unused-imports': 'warn',
      'unicorn/prefer-dom-node-text-content': 'off',

      'format/prettier': 'off',

      'regexp/optimal-quantifier-concatenation': 'warn',
      'regexp/no-super-linear-backtracking': 'warn',
      'regexp/no-unused-capturing-group': 'warn',

      'style/comma-dangle': ['error', 'always-multiline'],

      'vue/block-order': ['warn', {
        order: ['template', 'script', 'style'],
      }],
      'vue/block-tag-newline': 'off',

      'vue/eqeqeq': ['warn', 'smart'],

      'vue/first-attribute-linebreak': ['warn', {
        multiline: 'below',
      }],
      "vue/no-mutating-props": ["error", {
        shallowOnly: true,
      }],
      'vue/max-attributes-per-line': ['error', {
        singleline: {
          max: 1,
        },
        multiline: {
          max: 1,
        },
      }],
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',

      'vue/html-self-closing': 'off',
      'vue/multiline-html-element-content-newline': 'off',

      'vue/valid-template-root': 'off',

      'vue/object-curly-newline': ['error', {
        multiline: true,
        minProperties: 2,
        consistent: true,
      }],
      'vue/object-property-newline': ['error', {
        allowAllPropertiesOnSameLine: false,
        allowMultiplePropertiesPerLine: true,
      }],
    },
  },
)
