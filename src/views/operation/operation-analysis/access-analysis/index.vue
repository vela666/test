<template>
  <div class="flex flex-direction-column gap20 overflow-y-auto">
    <div class="nd-title c1c2028 fz18">用户分析</div>
    <div class="flex-center gap20 nd-analysis">
      <div class="nd-analysis-l gap10">
        <div class="nd-analysis-title">用户数</div>
        <div class="c545e6e">总用户数：{{ pieData.sum }}</div>
        <Chart height="320px" ref="chartRef" :options="pieData.chart" />
      </div>
      <div class="nd-analysis-r">
        <div class="flex-center flex-between">
          <div class="nd-analysis-title">用户分布-按企业</div>

          <ChartType :data="displayMode()" v-model="state.userTopChartType" />
        </div>
        <Chart
          v-if="state.userTopChartType === 'barstack'"
          height="340px"
          ref="chartRef"
          :options="topData" />
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
          :footer-data="topData.footerData"
          :data="topData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of topData.columns"
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

    <div class="nd-title c1c2028 fz18">访问分析</div>
    <div class="flex-center gap20">
      <DateRangeSelect
        ref="dateRangeSelectRef"
        :needDynamic="false"
        v-model="filterConfig.dateRange" />
      <SelectCompany v-model="filterConfig.companyCodeList" />
    </div>
    <div class="flex-center nd-analysis">
      <div class="nd-analysis-r">
        <div class="flex-center flex-between">
          <span class="nd-analysis-title">登录统计-按日期</span>

          <ChartType :data="displayMode()" v-model="state.dateLoginChartType" />
        </div>
        <Chart
          v-if="state.dateLoginChartType === 'barstack'"
          height="340px"
          ref="chartRef"
          :options="dateLoginData" />
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
          :footer-data="dateLoginData.footerData"
          :data="dateLoginData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of dateLoginData.columns"
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
          <span class="nd-analysis-title">登录统计-按时间段</span>

          <ChartType
            :data="displayMode('line')"
            v-model="state.timePeriodLoginChartType" />
        </div>
        <Chart
          v-if="state.timePeriodLoginChartType === 'line'"
          height="340px"
          ref="chartRef"
          :options="timePeriodLoginData" />
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
          :footer-data="timePeriodLoginData.footerData"
          :data="timePeriodLoginData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of timePeriodLoginData.columns"
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
          <span class="nd-analysis-title">访问统计-按日期</span>

          <ChartType :data="displayMode()" v-model="state.dateVisitChartType" />
        </div>

        <Chart
          v-if="state.dateVisitChartType === 'barstack'"
          height="340px"
          ref="chartRef"
          :options="dateVisitData" />
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
          :footer-data="dateVisitData.footerData"
          :data="dateVisitData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of dateVisitData.columns"
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
          <span class="nd-analysis-title">访问统计-按时间段</span>

          <ChartType
            :data="displayMode('line')"
            v-model="state.timePeriodVisitChartType" />
        </div>
        <Chart
          v-if="state.timePeriodVisitChartType === 'line'"
          height="340px"
          ref="chartRef"
          :options="timePeriodVisitData" />
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
          :footer-data="timePeriodVisitData.footerData"
          :data="timePeriodVisitData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of timePeriodVisitData.columns"
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
import { computed, createApp, reactive, watch } from 'vue'
import { recent7DayEnd, recent7DayStart } from '@/enumeration/date.js'
import ChartType from '@/views/analysis/components/AnalysisMain/ChartType.vue'
import { asyncGetAccessReport } from '@/api/modules/operation-analysis.js'
import { displayMode, mapFooterData, userState } from '../utils.js'
import SelectCompany from '../components/SelectCompany.vue'
import { debounce } from 'lodash-es'
import { thousandsFilter } from '@/utils/index.js'
import ChartTooltip from '../components/ChartTooltip.vue'
import { setWeekEndMark } from '@/components/Chart/utils.js'

const options = {
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
  legend: {
    itemHeight: 6,
    itemWidth: 16,
    // orient: 'vertical',
    icon: 'circle',
    // bottom: '8%',
    type: 'scroll',
    // left: 'left',
    // 解决circle文字不对齐问题
  },
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

const state = reactive({
  userTopChartType: 'barstack',
  dateLoginChartType: 'barstack',
  timePeriodLoginChartType: 'line',
  dateVisitChartType: 'barstack',
  timePeriodVisitChartType: 'line',
  chartData: {
    accessStackBarByDateDataList: [],
    accessStackBarByTimeDataList: [],
    accessXAxisByDateDataList: [],
    accessXAxisByTimeDataList: [],
    accessYAxisByDateDataList: [],
    accessYAxisByTimeDataList: [],
    loginStackBarByDateDataList: [],
    loginStackBarByTimeDataList: [],
    loginXAxisByDateDataList: [],
    loginXAxisByTimeDataList: [],
    loginYAxisByDateDataList: [],
    loginYAxisByTimeDataList: [],
    userPieDataList: [],
    userStackBarDataList: [],
    userXAxisDataList: [],
    userYAxisDataList: [],
  },
})
const filterConfig = reactive({
  dateRange: {
    date: [recent7DayStart, recent7DayEnd],
    diff: '',
  },
  companyCodeList: [],
})

const pieData = computed(() => {
  const sum = state.chartData.userPieDataList.reduce(
    (p, c) => (p += c.total),
    0
  )
  return {
    sum: thousandsFilter(sum),
    chart: {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        itemHeight: 10,
        itemWidth: 10,
        icon: 'circle',
        // bottom: '8%',
        type: 'scroll',
        show: true,
        formatter(name) {
          return name.split('\n')[0]
        },
      },
      series: [
        {
          type: 'pie',
          radius: '60%',
          data: state.chartData.userPieDataList.map((item, i) => {
            return {
              value: item.total,
              name: `${userState[item.state].label}\n${item.total}(${((item.total / sum) * 100).toFixed(2)}%)`,
              label: {
                lineHeight: 15,
              },
              itemStyle: {
                color: userState[i].color,
              },
            }
          }),
        },
      ],
    },
  }
})

const mapData = (data, key = 'targetName', chartType = 'bar') => {
  const map = {}

  for (let listIdx = 0; listIdx < data.length; listIdx++) {
    for (const tmp of data[listIdx]) {
      if (key !== 'state') {
        // 初始化一个长度相同的数组
        if (!map[tmp[key]]) {
          map[tmp[key]] = Array.from({ length: data.length }, () => '-')
        }
        // 直接填充对应下标usersNum值
        map[tmp[key]][listIdx] = tmp.total
      } else {
        // 初始化一个长度相同的数组
        if (!map[userState[tmp[key]].label]) {
          map[userState[tmp[key]].label] = Array.from(
            { length: data.length },
            () => '-'
          )
        }
        // 直接填充对应下标usersNum值
        map[userState[tmp[key]].label][listIdx] = tmp.total
      }
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
      type: chartType,
      barGap: 0,
      stack: 'label',
      label: {
        show: false,
      },
      smooth: true,
      emphasis: {
        focus: 'series',
      },
      // 设置柱子最大宽度为 30
      barMaxWidth: 30,
      data: map[value],
    }
  })
}

const topData = computed(() => {
  const userXAxisDataList = state.chartData.userXAxisDataList
  const userStackBarDataList = state.chartData.userStackBarDataList

  if (state.userTopChartType === 'table') {
    const { tableData, footer } = userStackBarDataList.flat().reduce(
      (acc, { targetName, total, state }) => {
        let enterprise = acc.tableData.find(
          (item) => item.enterprises === targetName
        )

        if (!enterprise) {
          enterprise = {
            enterprises: targetName,
            total: 0,
            normal: 0,
            toBeActivated: 0,
            lock: 0,
            disable: 0,
          }
          acc.tableData.push(enterprise)
        }

        enterprise.total += total
        enterprise[userState[state].alias] = total

        acc.footer.total += total
        acc.footer[userState[state].alias] += total

        return acc
      },
      {
        tableData: [],
        footer: {
          enterprises: '汇总/平均',
          total: 0,
          normal: 0,
          toBeActivated: 0,
          lock: 0,
          disable: 0,
        },
      }
    )

    const columns = [
      {
        title: '企业',
        prop: 'enterprises',
        footer: footer.enterprises,
      },
      {
        title: '总人数',
        prop: 'total',
        footer: footer.total,
      },
      {
        title: '正常人数',
        prop: 'normal',
        footer: footer.normal,
      },
      {
        title: '待激活人数',
        prop: 'toBeActivated',
        footer: footer.toBeActivated,
      },
      {
        title: '锁定人数',
        prop: 'lock',
        footer: footer.lock,
      },
      {
        title: '禁用人数',
        prop: 'disable',
        footer: footer.disable,
      },
    ]

    return {
      columns,
      tableData,
      footerData: mapFooterData(columns),
    }
  }
  const xData = userXAxisDataList.map((item) => item.targetDescription)

  return {
    ...options,
    xAxis: {
      ...options.xAxis,
      data: xData,
      axisLabel: {
        ...options.xAxis.axisLabel,
        show: true,
        rotate: 35,
      },
    },
    series: mapData(userStackBarDataList, 'state').map((item, i) => {
      return {
        ...item,
        itemStyle: {
          color: userState[i].color,
        },
      }
    }),
    graphic: {
      ...options.graphic,
      invisible: !!xData.length,
    },
  }
})

const dateLoginData = computed(() => {
  if (state.dateLoginChartType === 'table') {
    const columns = [
      {
        title: '日期',
        prop: `date`,
        footer: '汇总/平均',
      },
      {
        title: '企业',
        prop: `enterprises`,
        footer: '-',
      },
      {
        title: '登录次数',
        prop: `total`,
        footer: thousandsFilter(
          state.chartData.loginYAxisByDateDataList.reduce((p, c) => {
            p += c.total
            return p
          }, 0)
        ),
      },
    ]
    return {
      columns,
      tableData: state.chartData.loginStackBarByDateDataList.reduce(
        (p, c, i) => {
          c.forEach((sub) => {
            p.push({
              date: state.chartData.loginXAxisByDateDataList[i]
                .targetDescription,
              enterprises: sub.targetName,
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
  const xData = state.chartData.loginXAxisByDateDataList.map(
    (item) => item.targetDescription
  )
  return {
    ...options,
    xAxis: {
      ...options.xAxis,
      data: xData,
    },
    series: setWeekEndMark(
      xData,
      mapData(state.chartData.loginStackBarByDateDataList)
    ),
    graphic: {
      ...options.graphic,
      invisible: !!xData.length,
    },
  }
})

const timePeriodLoginData = computed(() => {
  if (state.timePeriodLoginChartType === 'table') {
    const columns = [
      {
        title: '时间',
        prop: `time`,
        footer: '汇总/平均',
      },
      {
        title: '企业',
        prop: `enterprises`,
        footer: '-',
      },
      {
        title: '登录次数',
        prop: `total`,
        footer: thousandsFilter(
          state.chartData.loginYAxisByTimeDataList.reduce((p, c) => {
            p += c.total
            return p
          }, 0)
        ),
      },
    ]
    return {
      columns,
      tableData: state.chartData.loginStackBarByTimeDataList.reduce(
        (p, c, i) => {
          c.forEach((sub) => {
            p.push({
              time:
                state.chartData.loginXAxisByTimeDataList[i].targetDescription +
                '点',
              enterprises: sub.targetName,
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
  const xData = state.chartData.loginXAxisByTimeDataList.map(
    (item) => item.targetDescription + '点'
  )
  return {
    ...options,
    xAxis: {
      ...options.xAxis,
      data: xData,
    },
    series: mapData(
      state.chartData.loginStackBarByTimeDataList,
      'targetName',
      state.timePeriodLoginChartType
    ),
    graphic: {
      ...options.graphic,
      invisible: !!xData.length,
    },
  }
})

const dateVisitData = computed(() => {
  if (state.dateVisitChartType === 'table') {
    const columns = [
      {
        title: '日期',
        prop: `date`,
        footer: '汇总/平均',
      },
      {
        title: '企业',
        prop: `enterprises`,
        footer: '-',
      },
      {
        title: '访问次数',
        prop: `total`,
        footer: thousandsFilter(
          state.chartData.accessYAxisByDateDataList.reduce((p, c) => {
            p += c.total
            return p
          }, 0)
        ),
      },
    ]
    return {
      columns,
      tableData: state.chartData.accessStackBarByDateDataList.reduce(
        (p, c, i) => {
          c.forEach((sub) => {
            p.push({
              date: state.chartData.accessXAxisByDateDataList[i]
                .targetDescription,
              enterprises: sub.targetName,
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
  const xData = state.chartData.accessXAxisByDateDataList.map(
    (item) => item.targetDescription
  )
  return {
    ...options,
    xAxis: {
      ...options.xAxis,
      data: xData,
    },
    series: setWeekEndMark(
      xData,
      mapData(state.chartData.accessStackBarByDateDataList)
    ),
    graphic: {
      ...options.graphic,
      invisible: !!xData.length,
    },
  }
})

const timePeriodVisitData = computed(() => {
  if (state.timePeriodVisitChartType === 'table') {
    const columns = [
      {
        title: '时间',
        prop: `time`,
        footer: '汇总/平均',
      },
      {
        title: '企业',
        prop: `enterprises`,
        footer: '-',
      },
      {
        title: '访问次数',
        prop: `total`,
        footer: thousandsFilter(
          state.chartData.accessYAxisByTimeDataList.reduce((p, c) => {
            p += c.total
            return p
          }, 0)
        ),
      },
    ]
    return {
      columns,
      tableData: state.chartData.accessStackBarByTimeDataList.reduce(
        (p, c, i) => {
          c.forEach((sub) => {
            p.push({
              time:
                state.chartData.accessXAxisByTimeDataList[i].targetDescription +
                '点',
              enterprises: sub.targetName,
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
  const xData = state.chartData.accessXAxisByTimeDataList.map(
    (item) => item.targetDescription + '点'
  )
  return {
    ...options,
    xAxis: {
      ...options.xAxis,
      data: xData,
    },
    series: mapData(
      state.chartData.accessStackBarByTimeDataList,
      'targetName',
      state.timePeriodVisitChartType
    ),
    graphic: {
      ...options.graphic,
      invisible: !!xData.length,
    },
  }
})

const getReport = async () => {
  const { data } = await asyncGetAccessReport({
    companyCodeList: filterConfig.companyCodeList,
    startDate: filterConfig.dateRange.date[0],
    endDate: filterConfig.dateRange.date[1],
  })
  state.chartData = data
}

watch(
  () => filterConfig,
  debounce(() => {
    getReport()
  }, 300),
  {
    deep: true,
    immediate: true,
  }
)
defineOptions({
  name: 'AccessAnalysis',
})
</script>

<style scoped lang="scss">
@import '../index.scss';
</style>
