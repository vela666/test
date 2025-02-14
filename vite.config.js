import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import fs from 'node:fs'
import vue from '@vitejs/plugin-vue'
import viteEslintPlugin from '@nabla/vite-plugin-eslint'

import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import Components from 'unplugin-vue-components/vite'
// vxe官网方式按需加载样式丢失 故使用这种方式
// https://www.npmjs.com/package/@vxecli/import-vite-plugin-style-import
import { createStyleImportPlugin } from 'vite-plugin-style-import'
import { VxeResolve } from '@vxecli/import-vite-plugin-style-import'

import { visualizer } from 'rollup-plugin-visualizer'
import postcssPresetEnv from 'postcss-preset-env'
import viewport from 'postcss-mobile-forever'

//import legacy from '@vitejs/plugin-legacy'
// 全局 scss 资源
const scssResources = []
fs.readdirSync('src/assets/styles/resources').forEach((dirname) => {
  if (fs.statSync(`src/assets/styles/resources/${dirname}`).isFile()) {
    scssResources.push(`@use "@/assets/styles/resources/${dirname}" as *; `)
  }
})

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const filePath = 'public/version.js'
    // 读取文件内容
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('reading error:', err)
        return
      }

      // 修改文件内容
      const modifiedData = data.replace(/[0-9]+/g, new Date().getTime())

      // 写入新内容
      fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
        if (err) {
          console.error('written to the error:', err)
          return
        }
      })
    })
  }

  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  // const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // 解决微前端控制台警告
            isCustomElement: (tag) => /^micro-app/.test(tag),
          },
        },
      }),
      viteEslintPlugin(),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        // 指定symbolId格式
        symbolId: 'icon-[dir]-[name]',

        /**
         * 自定义插入位置
         * @default: body-last
         */
        //inject:  'body-first',

        /**
         * custom dom id
         * @default: __svg__icons__dom__
         */
        //customDomId: '__svg__icons__dom__',
      }),
      createStyleImportPlugin({
        resolves: [
          VxeResolve({
            libraryName: 'vxe-table',
            // importStyle: true
          }),
          VxeResolve({
            libraryName: 'vxe-pc-ui',
            // importStyle: true
          }),
        ],
      }),
      Components({
        /* resolvers: [
          /!*  {
            type: 'component',
            resolve: function resolve(name) {
              const vxeRest = name.match(/^Vxe(\w+)$/)
              if (vxeRest) {
                const dirName = XEUtils.kebabCase(vxeRest[1])
                const path = 'vxe-table/es'
                const conf = {
                  name: name,
                  from: ''.concat(path, '/').concat(dirName, '/index.js'),
                }
                conf.sideEffects = ''
                  .concat(path, '/')
                  .concat(dirName, '/style.css')
                console.log(conf)
                return conf
              }
              /!* var vxeRest = name.match(/^Vxe(\w+)$/)
              if (vxeRest) {
                var dirName = _xeUtils['default'].kebabCase(vxeRest[1])
                var path = 'vxe-table/es'
                var conf = {
                  name: name,
                  from: ''.concat(path, '/').concat(dirName, '/index.js'),
                }
                if (opts.importStyle) {
                  conf.sideEffects = ''
                    .concat(path, '/')
                    .concat(dirName, '/style.css')
                }
                return conf
              }*!/
            },
          },*!/
        ],*/
        // 全局组件注册
        // globs: ['src/components/*/index.vue'],
        // 组件的有效文件扩展名
        extensions: ['vue'],
      }),
      visualizer({
        // open: true,
        // gzipSize: true,
        // brotliSize: true,
        // filename: 'report.html',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@mobile': path.resolve(__dirname, 'mobile/src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler', // 或 "modern"，"legacy"
          additionalData: scssResources.join(''),
        },
      },
      postcss: {
        // css属性自动添加浏览器厂商前缀
        plugins: [
          postcssPresetEnv(),
          // https://github.com/wswmsword/postcss-mobile-forever
          viewport({
            appSelector: '#mobile',
            viewportWidth: 375,
            maxDisplayWidth: 600,
            // rootContainingBlockSelectorList: ['van-tabbar', 'van-popup'],
            // exclude: [/node_modules\/vxe-table/, /src[\\/]/],
            include: [/mobile[\\/]src[\\/]/],
            // exclude: [/src[\\/]/],
            border: true,
            valueBlackList: ['1px solid'],
          }),
        ],
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 3500,
      emptyOutDir: true,
      // 启用/禁用 gzip 压缩大小报告
      reportCompressedSize: false,
      rollupOptions: {
        input: {
          // http://127.0.0.1:5173
          index: path.resolve(__dirname, 'index.html'),
          // http://127.0.0.1:5173/page1.html
          mobile: path.resolve(__dirname, 'mobile/index.html'),
        },
        output: {
          chunkFileNames: 'js/[name]-[hash].js', // 引入文件名的名称
          entryFileNames: 'js/[name]-[hash].js', // 包的入口文件名称
          assetFileNames: '[ext]/[name]-[hash].[ext]', // 资源文件像 字体，图片等
        },
      },
    },
    // build.minify为 esbuild
    esbuild: {
      // 删除console || debugger 等
      pure: ['console.log', 'console.warn'],
      drop: ['debugger'],
      // 删除所有的console语句和debugger，包括console.log、console.warn、console.error等
      // drop: ['console', 'debugger'],
    },
  }
})
