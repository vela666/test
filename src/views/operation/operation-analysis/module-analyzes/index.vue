<template>
  <div
    v-loading="state.loading"
    class="flex flex-direction-column gap20 overflow-y-auto">
    <div class="nd-title c1c2028 fz18">模块分析</div>
    <div class="flex-center gap20">
      <DateRangeSelect
        ref="dateRangeSelectRef"
        :needDynamic="false"
        v-model="filterConfig.dateRange" />
      <SelectCompany v-model="filterConfig.companyCodeList" />
      <el-button type="primary" @click="getList">查询</el-button>
    </div>
    <div class="flex-center nd-analysis">
      <div class="nd-analysis-r">
        <div class="flex-center flex-between">
          <span class="nd-analysis-title">访问次数-按模块统计</span>

          <ChartType :data="displayMode()" v-model="state.moduleChartType" />
        </div>
        <Chart
          v-if="state.moduleChartType === 'barstack'"
          height="340px"
          ref="chartRef"
          :options="moduleData" />
        <vxe-table
          v-else
          border
          ref="vxeTableRef"
          class="nd-vxe-table-custom nd-vxe-column-center"
          max-height="340px"
          auto-resize
          show-overflow
          show-header-overflow
          :row-config="{ isHover: true }"
          :column-config="{ resizable: true }"
          show-footer
          :footer-row-style="() => 'background-color: #f6f6f9'"
          :footer-data="moduleData.footerData"
          :data="moduleData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of moduleData.columns"
            :field="item.prop"
            :key="item.prop">
            <template #default="{ row }">
              {{ thousandsFilter(row[item.prop]) }}
            </template>
            <template #footer="{ row }">
              {{ thousandsFilter(row[item.prop]) }}
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>

    <div class="flex-center nd-analysis">
      <div class="nd-analysis-r">
        <div class="flex-center flex-between">
          <span class="nd-analysis-title">访问次数-按企业统计</span>

          <ChartType
            :data="displayMode()"
            v-model="state.enterprisesChartType" />
        </div>
        <Chart
          v-if="state.enterprisesChartType === 'barstack'"
          height="340px"
          ref="chartRef"
          :options="enterpriseData" />
        <vxe-table
          v-else
          border
          ref="vxeTableRef"
          class="nd-vxe-table-custom nd-vxe-column-center"
          max-height="340px"
          auto-resize
          show-overflow
          show-header-overflow
          :row-config="{ isHover: true }"
          :column-config="{ resizable: true }"
          show-footer
          :footer-row-style="() => 'background-color: #f6f6f9'"
          :footer-data="enterpriseData.footerData"
          :data="enterpriseData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of enterpriseData.columns"
            :field="item.prop"
            :key="item.prop">
            <template #default="{ row }">
              {{ thousandsFilter(row[item.prop]) }}
            </template>
            <template #footer="{ row }">
              {{ thousandsFilter(row[item.prop]) }}
            </template>
          </vxe-column>
        </vxe-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, createApp } from 'vue'
import { recent7DayEnd, recent7DayStart } from '@/enumeration/date.js'
import ChartType from '@/views/analysis/components/AnalysisMain/ChartType.vue'
import { displayMode } from '../utils.js'
import SelectCompany from '@/views/operation/operation-analysis/components/SelectCompany.vue'
import { debounce } from 'lodash-es'
import { thousandsFilter } from '@/utils/index.js'
import ChartTooltip from '../components/ChartTooltip.vue'
import EnterprisesTooltip from './components/EnterprisesTooltip.vue'
import { asyncGetModuleReport } from '@/api/modules/operation-analysis.js'
import { mapFooterData } from '../utils.js'

const state = reactive({
  moduleChartType: 'barstack',
  enterprisesChartType: 'barstack',
  chartData: {
    companyStackBarByDateDataList: [],
    companyXAxisDataList: [],
    companyYAxisByDateDataList: [],
    moduleStackBarByDateDataList: [],
    moduleXAxisDataList: [],
    moduleYAxisByDateDataList: [],
  },
})

const filterConfig = reactive({
  dateRange: {
    date: [recent7DayStart, recent7DayEnd],
    diff: '',
  },
  companyCodeList: [],
})

const options = {
  grid: {
    // left: '8%',
    top: '10%',
    left: '3%',
    height: '75%',
    width: '93%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    // axisTick: { show: false, alignWithLabel: true },
    axisLabel: {
      color: '#86919d',
    },
    axisPointer: {
      //单个展示增加配置 只有hover柱状图 才显示提示
      show: true,
      type: 'shadow',
      label: {
        show: false,
      },
    },
    axisLine: {
      lineStyle: {
        color: '#cbd0d6',
      },
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      // show: true,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#e7e7ea',
        type: 'dashed',
      },
    },
  },
  dataZoom: {
    realtime: false,
    type: 'slider',
    show: true,
    xAxisIndex: [0],
    // realtime: false,
    filterMode: 'filter',
    // zoomLock: true,
    brushSelect: false,
    // throttle: 300,
    bottom: 3,
    // left: '3%',
    start: 0,
    end: 100,
    showDetail: false,
    showDataShadow: false,
    height: '6%',
  },
  graphic: {
    type: 'text',
    left: 'center',
    top: '50%',
    invisible: true,
    style: {
      text: '暂无数据',
      textAlign: 'center',
      fill: '#333',
      fontSize: 14,
    },
  },
}

// 重名处理加后缀
/*
const appendSuffixes = (data) => {
  const nameCounts = new Map()

  data.forEach((subArray) => {
    nameCounts.clear()
    subArray.forEach((item) => {
      const baseName = item.targetName
      if (!nameCounts.has(baseName)) {
        nameCounts.set(baseName, 1)
      } else {
        const count = nameCounts.get(baseName) + 1
        nameCounts.set(baseName, count)
        item.targetName = `${baseName}${count}`
      }
    })
  })

  return data
}
*/

const mapData = (data) => {
  const map = {}

  for (let listIdx = 0; listIdx < data.length; listIdx++) {
    for (const { targetName, total, subPageList = [] } of data[listIdx]) {
      // 初始化一个长度相同的数组
      if (!map[targetName]) {
        map[targetName] = Array.from({ length: data.length }, () => {
          return {
            value: '-',
            subPageList,
          }
        })
      }
      // 直接填充对应下标usersNum值
      map[targetName][listIdx] = { value: total, subPageList }
    }
  }
  // 找到最小的值
  /* const minValue = data
    .flat() // Flatten the array of arrays into a single array
    .map((item) => item.usersNum) // Extract the usersNum values into a new array
    .reduce((min, usersNum) => Math.min(min, usersNum), 0) // Find the minimum usersNum value*/
  return Object.keys(map).map((value) => {
    return {
      name: value,
      type: 'bar',
      barGap: 0,
      stack: 'label',
      label: {
        show: false,
      },
      emphasis: {
        focus: 'series',
      },
      // 设置柱子最大宽度为 30
      barMaxWidth: 30,
      data: map[value],
    }
  })
}

const enterpriseData = computed(() => {
  if (state.enterprisesChartType === 'table') {
    const columns = [
      {
        title: '企业',
        prop: `enterprises`,
        footer: '汇总/平均',
      },
      {
        title: '一级模块',
        prop: `model`,
        footer: '-',
      },
      {
        title: '子模块',
        prop: `page`,
        footer: '-',
      },
      {
        title: '访问次数',
        prop: `total`,
        footer: thousandsFilter(
          state.chartData.companyYAxisByDateDataList.reduce((p, c) => {
            p += c.total
            return p
          }, 0)
        ),
      },
    ]
    return {
      columns,
      tableData: state.chartData.companyStackBarByDateDataList.reduce(
        (p, c, i) => {
          c.forEach((sub) => {
            const enterprises =
              state.chartData.companyXAxisDataList[i].targetDescription
            sub.subPageList.forEach((val) => {
              p.push({
                enterprises,
                page: val.targetName,
                model: sub.targetName,
                total: val.total,
              })
            })
          })
          return p
        },
        []
      ),
      footerData: mapFooterData(columns),
    }
  }
  const xData = state.chartData.companyXAxisDataList.map(
    (item) => item.targetDescription
  )

  return {
    ...options,
    tooltip: {
      trigger: 'axis',
      extraCssText: 'padding:0;',
      enterable: true, //鼠标可进入提示框浮层中
      confine: true, //将 tooltip 框限制在图表的区域内
      axisPointer: {
        type: 'shadow',
      },
      // 紧贴鼠标，使鼠标能够轻松进入框内
      position(point, params, dom, rect, size) {
        // 提示框位置
        let x, y
        // 当前鼠标位置
        const pointX = point[0]
        const pointY = point[1]
        // 提示框尺寸
        const boxWidth = size.contentSize[0]
        const boxHeight = size.contentSize[1]
        // 容器尺寸
        const viewWidth = size.viewSize[0]
        // const viewHeight = size.viewSize[1]
        // 设置光标左右位置
        if (viewWidth - boxWidth < pointX) {
          // 光标位置 大于 容器减去提示框的位置，右边放不下，放在左侧
          x = pointX - boxWidth
        } else {
          // 默认紧贴光标右侧显示
          x = pointX
        }
        // 设置光标上下位置
        if (boxHeight < pointY) {
          // 光标位置 小于 提示框位置，上面放不下，放在下侧
          y = pointY - boxHeight
        } else {
          // 默认紧贴光标上侧显示
          y = pointY
        }
        // 记录提示框位置
        // if (window.tooltipSpace?.position) window.tooltipSpace.position = [x, y]
        return [x, y]
      },
      formatter(params) {
        if (params.length) {
          // 容器，之后会把组件渲染在容器中
          const div = document.createElement('div')
          // vue文件直接用不行，得创建app实例,同时提供组件的props
          const app = createApp(EnterprisesTooltip, { params })
          // 将app实例挂载到dom上
          app.mount(div)
          // 将含有组件实例的dom返回给echats
          return div
        }
      },
    },

    xAxis: {
      ...options.xAxis,
      axisLabel: {
        ...options.xAxis.axisLabel,
        show: true,
        rotate: 35,
      },
      data: xData,
    },
    /*  series: mapData(
      appendSuffixes(state.chartData.companyStackBarByDateDataList)
    ),*/
    series: mapData(state.chartData.companyStackBarByDateDataList),
    graphic: {
      ...options.graphic,
      invisible: !!xData.length,
    },
  }
})

const moduleData = computed(() => {
  if (state.moduleChartType === 'table') {
    const columns = [
      {
        title: '一级模块',
        prop: `model`,
        footer: '汇总/平均',
      },
      {
        title: '子模块',
        prop: `page`,
        footer: '-',
      },
      {
        title: '访问次数',
        prop: `total`,
        footer: thousandsFilter(
          state.chartData.moduleYAxisByDateDataList.reduce((p, c) => {
            p += c.total
            return p
          }, 0)
        ),
      },
    ]
    return {
      columns,
      tableData: state.chartData.moduleStackBarByDateDataList.reduce(
        (p, c, i) => {
          c.forEach((sub) => {
            p.push({
              model: state.chartData.moduleXAxisDataList[i].targetDescription,
              page: sub.targetName,
              total: sub.total,
            })
          })
          return p
        },
        []
      ),
      footerData: mapFooterData(columns),
    }
  }
  const xData = state.chartData.moduleXAxisDataList.map(
    (item) => item.targetDescription
  )
  return {
    ...options,
    tooltip: {
      trigger: 'axis',
      extraCssText: 'padding:0;',
      enterable: true, //鼠标可进入提示框浮层中
      confine: true, //将 tooltip 框限制在图表的区域内
      axisPointer: {
        type: 'shadow',
      },
      // 紧贴鼠标，使鼠标能够轻松进入框内
      position(point, params, dom, rect, size) {
        // 提示框位置
        let x, y
        // 当前鼠标位置
        const pointX = point[0]
        const pointY = point[1]
        // 提示框尺寸
        const boxWidth = size.contentSize[0]
        const boxHeight = size.contentSize[1]
        // 容器尺寸
        const viewWidth = size.viewSize[0]
        // const viewHeight = size.viewSize[1]
        // 设置光标左右位置
        if (viewWidth - boxWidth < pointX) {
          // 光标位置 大于 容器减去提示框的位置，右边放不下，放在左侧
          x = pointX - boxWidth
        } else {
          // 默认紧贴光标右侧显示
          x = pointX
        }
        // 设置光标上下位置
        if (boxHeight < pointY) {
          // 光标位置 小于 提示框位置，上面放不下，放在下侧
          y = pointY - boxHeight
        } else {
          // 默认紧贴光标上侧显示
          y = pointY
        }
        // 记录提示框位置
        // if (window.tooltipSpace?.position) window.tooltipSpace.position = [x, y]
        return [x, y]
      },
      formatter(params) {
        if (params.length) {
          // 容器，之后会把组件渲染在容器中
          const div = document.createElement('div')
          // vue文件直接用不行，得创建app实例,同时提供组件的props
          const app = createApp(ChartTooltip, { params })
          // 将app实例挂载到dom上
          app.mount(div)
          // 将含有组件实例的dom返回给echats
          return div
        }
      },
    },

    xAxis: {
      ...options.xAxis,
      data: xData,
    },
    series: mapData(state.chartData.moduleStackBarByDateDataList),
    graphic: {
      ...options.graphic,
      invisible: !!xData.length,
    },
  }
})

const getReport = async () => {
  state.loading = true
  try {
    const { data } = await asyncGetModuleReport({
      companyCodeList: filterConfig.companyCodeList,
      startDate: filterConfig.dateRange.date[0],
      endDate: filterConfig.dateRange.date[1],
    })
    state.chartData = data
  } catch (error) {
  } finally {
    state.loading = false
  }
}

const getList = debounce(async (type) => {
  getReport()
}, 300)

getList()

defineOptions({
  name: 'ModuleAnalyzes',
})
</script>

<style scoped lang="scss">
@import '../index.scss';
</style>
