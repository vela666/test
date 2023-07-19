import { createApp } from 'vue'
import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'
// import "element-plus/theme-chalk/src/index.scss";

import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus, {  namespace: 'ep' })

app.mount('#app')
