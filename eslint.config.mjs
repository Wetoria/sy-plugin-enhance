import antfu from '@antfu/eslint-config'

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
      // ...globs
    ],
  },
  {
    rules: {
      'object-curly-newline': ['error', {
        multiline: true,
        minProperties: 1,
        consistent: true,
      }],
      'object-property-newline': ['error', {
        allowAllPropertiesOnSameLine: false,
      }],
      'comma-dangle': ['warn', 'always-multiline'],
      'ts/explicit-function-return-type': 'off',
    },
  },
)
