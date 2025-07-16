/* eslint-disable perfectionist/sort-imports */
/* eslint-disable node/prefer-global/process */
import { vitePluginForArco } from "@arco-plugins/vite-vue"
import vue from "@vitejs/plugin-vue"
import minimist from "minimist"
import {
  readdirSync,
  statSync,
} from 'node:fs'
import {
  basename,
  join,
  resolve,
} from "node:path"
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
        generateI18nFiles()
      } catch (error) {
        console.error('Failed to generate i18n files:', error)
      }
    },
  }
}


// 获取指定目录下的所有Vue文件作为入口点
function getVueEntries(entryDir) {
  const entries = {}

  // 同步读取目录并处理文件
  function scanDirectory(dir) {
    readdirSync(dir).forEach((file) => {
      const fullPath = join(dir, file)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        scanDirectory(fullPath) // 递归处理子目录
      } else if (file.endsWith('.vue')) {
        // 使用文件名（不含扩展名）作为入口名称
        const fileName = basename(file, '.vue')
        entries[fileName] = fullPath
      }
    })
  }

  scanDirectory(entryDir)
  return entries
}


export default defineConfig(({ mode }) => {

  const devDistDir = getDistDir(mode)



  // 解析命令行参数
  const args = minimist(process.argv.slice(2))
  const isWatch = args.watch || args.w || false
  const isDeveloping = isWatch
  const isProduction = !isDeveloping


  // 根据是否构建publish版本设置输出目录
  const distDir = isDeveloping ? devDistDir : './dist/shared'

  console.log(`\n Shared components will be built into the following directory:`)
  console.log("\x1B[32m%s\x1B[0m", `\n${distDir}\n\n`)


  // 获取入口点
  const entryDir = resolve(__dirname, 'src/shared') // 指定你的Vue文件目录
  const entries = getVueEntries(entryDir)


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
        ],
      }),
    ],


    define: {
      "process.env.DEV_MODE": `"${isDeveloping}"`,
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },


    build: {
      outDir: distDir,
      emptyOutDir: isProduction,
      sourcemap: false,
      minify: isProduction,

      lib: {
        entry: entries,
        fileName: (format, entryName) => `${entryName}.js`,
        formats: ["es"],
      },

      cssCodeSplit: true, // 启用CSS代码分割

      rollupOptions: {
        plugins: [
          ...(isDeveloping
            ? [
              ]
            : [
                zipPack({
                  inDir: "./dist",
                  outDir: "./",
                  outFileName: "package.zip",
                }),
              ]),
        ],

        // 主构建中不external vue，publish构建中external vue
        external: ['siyuan', 'process', 'vue', '@arco-design/web-vue'],

        output: {
          exports: 'named',
          entryFileNames: "[name].js",
          chunkFileNames: "vendor.js",
          manualChunks(id) {
            // 将所有外部依赖打包到vendor.js
            if (id.includes('node_modules')) {
              return 'vendor'
            }

            // 为每个入口创建单独的块
            for (const entryName in entries) {
              if (id.includes(entryName)) {
                return entryName
              }
            }

            return null
          },
          // 关键修改：添加globals配置
          globals: {
            "vue": 'Vue',
            '@arco-design/web-vue': 'arco',
          },
        },
      },
    },
  }
})
