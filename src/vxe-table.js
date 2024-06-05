// vxe官网方式按需加载样式丢失
import {
  VxeUI,
  VxeTable,
  VxeColumn,
  VxeColgroup,
  VxeGrid,
  VxeToolbar
} from 'vxe-table'

import {
  VxeButton,
  VxeIcon,
  VxeLoading,
  VxeModal,
  VxeTooltip,
} from 'vxe-pc-ui'

// 导入主题变量，也可以重写主题变量
import 'vxe-table/styles/cssvar.scss'
import 'vxe-pc-ui/styles/cssvar.scss'

// 导入默认的语言
import zhCN from 'vxe-pc-ui/lib/language/zh-CN'

VxeUI.setI18n('zh-CN', zhCN)
VxeUI.setLanguage('zh-CN')

export default function (app) {
  // 可选组件
  app
    .use(VxeTable)
    .use(VxeIcon)
    .use(VxeColumn)
    .use(VxeGrid)
    .use(VxeTooltip)
    .use(VxeModal)
    .use(VxeButton)
    .use(VxeLoading)
}
