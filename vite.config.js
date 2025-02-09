import { URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import viewport from 'postcss-mobile-forever'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  root: './src/packages/',
  // root: resolve(__filename, 'src/packages/'),
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    open: true // 是否自动在浏览器打开
  },
  css: {
    postcss: {
      plugins: [
        // https://github.com/wswmsword/postcss-mobile-forever
        viewport({
          appSelector: '#mobile',
          viewportWidth: 375,
          maxDisplayWidth: 600,
          rootContainingBlockSelectorList: ['van-tabbar', 'van-popup'],
          exclude: [/node_modules/,/packages[\\/]index/, /assets[\\/]/],
          border: true
        })
      ]
    }
  },
  build: {
    rollupOptions: {
      input: {
        // http://127.0.0.1:5173
        main: resolve(__dirname, 'src/packages/index.html'),
        // http://127.0.0.1:5173/page1.html
        mobile: resolve(__dirname, 'src/packages/mobile.html')
      },
      /* input: {
               app1: resolve(__dirname, 'src/packages/index.html'),
               app2: resolve(__dirname, 'src/packages/app2.html'),
             },*/
      // input: [resolve(__dirname, 'src/packages/index.html'),  resolve(__dirname, 'src/packages/app2.html')],
      // input: ['./src/packages/index.html', './src/packages/page1.html'],
      output: {
        dir: './dist'
        // chunkFileNames: 'js/[name]-[hash].js',
        // entryFileNames: 'js/[name]-[hash].js',
        // assetFileNames: '[ext]/[name]-[hash].[ext]',
      }
    }
  }
})
