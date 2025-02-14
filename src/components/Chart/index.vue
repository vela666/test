<template>
  <div
    :style="`min-width: ${width}; min-height: ${height}`"
    :id="chartId"
    ref="chart"
    class="chart"></div>
</template>
<script setup>
import { ref, nextTick, markRaw, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
/*// 按需 引入 echarts 核心模块，核心模块提供了 echarts 使用必须要的接口。
import * as echarts from 'echarts/core'
// 引入图表，图表后缀都为 Chart
import { LineChart, BarChart } from 'echarts/charts'
// 引入提示框等，组件后缀都为 Component
import {
  LegendComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  DataZoomComponent,
  DataZoomInsideComponent
} from 'echarts/components'
// 标签自动布局，全局过渡动画等特性
import { LabelLayout, UniversalTransition } from 'echarts/features'
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须的组件
echarts.use([
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  GridComponent,
  LineChart,
  BarChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer
])*/
import { debounce } from 'lodash-es'
import { v4 as uuidv4 } from 'uuid'
// 避免看板多图展示时id重复
const chartId = ref(`${uuidv4()}_chart`)

const props = defineProps({
  options: {
    type: Object,
    default() {
      return {}
    },
  },
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '200px',
  },
})
const emit = defineEmits(['change'])
// 获取真实DOM
let chart = ref()
// 存储图表实例
let myChart = ref(null)
let resizeHandler = null
const initEcharts = (options) => {
  nextTick(() => {
    // myChart && myChart.dispose()
    myChart.value = markRaw(echarts.init(chart.value, 'light'))
    myChart.value.setOption(options)
    myChart.value.resize()
  })
}
let observer = null
onMounted(() => {
  initEcharts(props.options)
  resizeHandler = debounce(() => {
    myChart.value?.resize()
    emit('change')
  }, 1000 / 60)
  const ele = document.getElementById(chartId.value)?.parentElement
  if (ele) {
    observer = new ResizeObserver(resizeHandler)
    observer.observe(ele, { box: 'border-box' })
  }

  // 图表自适应
  // window.addEventListener('resize', resizeHandler)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  myChart.value?.dispose()
  myChart.value = null
  //window.removeEventListener('resize', resizeHandler)
})

watch(
  () => props.options,
  (val) => {
    myChart.value?.setOption(props.options, {
      notMerge: true,
    })
    // initEcharts(props.options)
  },
  { deep: true }
)

watch(
  () => props.width,
  () => {
    nextTick(() => {
      myChart.value?.resize()
    })
  }
)

defineExpose({
  myChart,
})

defineOptions({
  name: 'Chart',
})
</script>

<style lang="scss" scoped></style>
