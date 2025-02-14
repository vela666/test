import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)
import mainHook from '@/mainHook.js'

mainHook(app, '#mobile')
