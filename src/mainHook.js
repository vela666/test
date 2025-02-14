// 引入ElementPlus
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import enUs from 'element-plus/es/locale/lang/en'
// 全局样式
import '@/assets/styles/global.scss'
// 加载 svg 图标
import 'virtual:svg-icons-register'
// 添加状态管理（pinia）
import pinia from './store'
// 添加路由
import router from './router'
// 引入全局自定义指令
import directive from '@/directive'
// vxe表格
import useVxeTable from '@/plugins/vxe-table'
import vueVirtualScroller from '@/plugins/vue-virtual-scroller.js'
// dayjs全局配置如插件 语言等
import '@/plugins/dayjs'

import { i18n } from '@/locales/i18n'
export default function (app, selector = '#app') {
  let localeEle = zhCn
  if (localStorage.getItem('Accept-Language') === 'en-US') {
    localeEle = enUs
  }
  app.use(i18n)
  app.use(pinia)
  app.use(router)

  // 注册全局自定义指令
  Object.keys(directive).forEach((item) => {
    app.directive(item, directive[item])
  })
  app.use(ElementPlus, {
    locale: localeEle,
  })
  useVxeTable(app)
  vueVirtualScroller(app)
  app.mount(selector)
}
