// 虚拟列表
// https://github.com/Akryum/vue-virtual-scroller/blob/master/packages/vue-virtual-scroller/README.md
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import VueVirtualScroller from 'vue-virtual-scroller'

export default function (app) {
  app.use(VueVirtualScroller)
}
