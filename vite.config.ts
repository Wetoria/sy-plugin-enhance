/* eslint-disable perfectionist/sort-imports */
/* eslint-disable node/prefer-global/process */
import { vitePluginForArco } from "@arco-plugins/vite-vue"
import vue from "@vitejs/plugin-vue"
import fg from "fast-glob"
import minimist from "minimist"
import { resolve } from "node:path"
import livereload from "rollup-plugin-livereload"
import Components from "unplugin-vue-components/vite"
import {
  defineConfig,
} from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import zipPack from "vite-plugin-zip-pack"
import { getDistDir } from './scripts/getDistDir'
import { generateI18nFiles } from "./src/i18n/generate"



export function initI18nBeforeCopy() {
  return {
    name: 'init-i18n-before-copy',
    buildStart() {
      try {
        // execSync('npx ts-node --esm ./src/i18n/generate.ts', { stdio: 'inherit' })
        generateI18nFiles()
      } catch (error) {
        console.error('Failed to generate i18n files:', error)
      }
    },
  }
}

export default defineConfig(({
  mode,
}) => {

  const devDistDir = getDistDir(mode)

  const args = minimist(process.argv.slice(2))
  const isWatch = args.watch || args.w || false
  const isDeveloping = isWatch
  const isProduction = !isDeveloping
  const distDir = isDeveloping ? devDistDir : "./dist"

  console.log(`\nYour plugin will be built into the following directory:`)
  console.log("\x1B[32m%s\x1B[0m", `\n${distDir}\n\n`)

  return {
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },

    plugins: [
      vue(),
      Components({
        dts: 'src/types/components.d.ts',
      }),
      vitePluginForArco({
        style: true,
        modifyVars: {
          'font-family': 'var(--b3-font-family)',
        },
      }),
      // initI18nBeforeCopy(),
      viteStaticCopy({
        targets: [
          {
            src: "./README*.md",
            dest: "./",
          },
          {
            src: "./icon.png",
            dest: "./",
          },
          {
            src: "./preview.png",
            dest: "./",
          },
          {
            src: "./plugin.json",
            dest: "./",
          },
          {
            src: "./src/i18n/*.json",
            dest: "./i18n/",
          },
          // {
          //   src: "./src/i18n/generated/*.json",
          //   dest: "./i18n/",
          // },
        ],
      }),
    ],

    // https://github.com/vitejs/vite/issues/1930
    // https://vitejs.dev/guide/env-and-mode.html#env-files
    // https://github.com/vitejs/vite/discussions/3058#discussioncomment-2115319
    // 在这里自定义变量
    define: {
      "process.env.DEV_MODE": `"${isDeveloping}"`,
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },

    build: {
      // 输出路径
      outDir: distDir,
      emptyOutDir: isProduction,

      // 构建后是否生成 source map 文件
      sourcemap: false,

      // 设置为 false 可以禁用最小化混淆
      // 或是用来指定是应用哪种混淆器
      // boolean | 'terser' | 'esbuild'
      // 不压缩，用于调试
      minify: isProduction,

      lib: {
        // Could also be a dictionary or array of multiple entry points
        entry: resolve(__dirname, "src/index.ts"),
        // the proper extensions will be added
        fileName: "index",
        formats: ["cjs"],
      },
      rollupOptions: {
        plugins: [
          ...(isDeveloping
            ? [
                livereload(devDistDir),
                {
                  // 监听静态资源文件
                  name: "watch-external",
                  async buildStart() {
                    const files = await fg([
                      "src/i18n/*.json",
                      "./README*.md",
                      "./plugin.json",
                    ])
                    for (const file of files) {
                      this.addWatchFile(file)
                    }
                  },
                },
              ]
            : [
                zipPack({
                  inDir: "./dist",
                  outDir: "./",
                  outFileName: "package.zip",
                }),
              ]),
        ],

        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: ["siyuan", "process"],

        output: {
          entryFileNames: "[name].js",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === "style.css") {
              return "index.css"
            }
            return assetInfo.name
          },
        },
      },
    },
  }
})
