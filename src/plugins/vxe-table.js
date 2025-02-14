import { watch } from 'vue'
import { useZIndex } from 'element-plus'
import domZindex from 'dom-zindex'
// vxe官网方式按需加载样式丢失
import {
  VxeUI,
  VxeTable,
  VxeColumn,
  // VxeColgroup,
  VxeGrid,
  // VxeToolbar,
} from 'vxe-table'

import {
  // VxeAlert,
  // VxeAnchor,
  // VxeAnchorLink,
  // VxeBreadcrumb,
  // VxeBreadcrumbItem,
  // VxeButton,
  // VxeButtonGroup,
  // VxeCalendar,
  // VxeCard,
  // VxeCheckbox,
  // VxeCheckboxGroup,
  // VxeCol,
  // VxeCollapse,
  // VxeCollapsePane,
  // VxeDateInput,
  // VxeDrawer,
  // VxeFlowDesign,
  // VxeFlowView,
  // VxeForm,
  // VxeFormDesign,
  // VxeFormGather,
  // VxeFormItem,
  // VxeFormView,
  VxeIcon,
  // VxeImage,
  // VxeImagePreview,
  // VxeInput,
  // VxeLayoutAside,
  // VxeLayoutBody,
  // VxeLayoutContainer,
  // VxeLayoutFooter,
  // VxeLayoutHeader,
  // VxeLink,
  // VxeListDesign,
  // VxeListView,
  // VxeList,
  VxeLoading,
  // VxeMenu,
  // VxeModal,
  // VxeNumberInput,
  // VxeOptgroup,
  // VxeOption,
  // VxePager,
  // VxePasswordInput,
  // VxePrintPageBreak,
  // VxePrint,
  // VxePulldown,
  // VxeRadio,
  // VxeRadioButton,
  // VxeRadioGroup,
  // VxeRow,
  // VxeSelect,
  // VxeSwitch,
  // VxeTabPane,
  // VxeTabs,
  // VxeTag,
  // VxeText,
  // VxeTextarea,
  // VxeTips,
  VxeTooltip,
  // VxeTree,
  // VxeTreeSelect,
  // VxeUpload,
} from 'vxe-pc-ui'

// 导入主题变量，也可以重写主题变量
import 'vxe-table/styles/cssvar.scss'
import 'vxe-pc-ui/styles/cssvar.scss'

// 导入默认的语言
import zhCN from 'vxe-pc-ui/lib/language/zh-CN'
VxeUI.setI18n('zh-CN', zhCN)
VxeUI.setLanguage('zh-CN')

export default function (app) {
  // 监听饿了么的zIndex变化
  watch(
    useZIndex().currentZIndex,
    (value) => {
      domZindex.setCurrent(value)
    },
    {
      deep: true,
    }
  )
  // 可选组件
  app
    .use(VxeTable)
    .use(VxeIcon)
    .use(VxeColumn)
    .use(VxeGrid)
    .use(VxeTooltip)
    .use(VxeLoading)
}
