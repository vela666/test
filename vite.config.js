import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {lazyImport, VxeResolver} from 'vite-plugin-lazy-import'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        lazyImport({
            resolvers: [
                VxeResolver({
                    libraryName: 'vxe-table'
                }),
                VxeResolver({
                    libraryName: 'vxe-pc-ui'
                })
            ]
        })],
})
