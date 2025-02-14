<template>
  <div
    v-loading="state.loading"
    class="flex flex-direction-column gap20 overflow-y-auto">
    <div class="nd-title c1c2028 fz18">项目分析</div>
    <div class="flex-center gap20">
      <DateRangeSelect
        ref="dateRangeSelectRef"
        :needDynamic="false"
        v-model="filterConfig.dateRange" />
      <!-- <el-select v-model="filterConfig.type" class="w210">
        <el-option :label="filterConfig.typeListName[0]" :value="0" />
        <el-option :label="filterConfig.typeListName[1]" :value="1" />
      </el-select> -->
      <SelectCompany v-model="filterConfig.companyCodeList" />
      <el-button type="primary" @click="getList">查询</el-button>
    </div>
    <div v-if="filterConfig.type === 0" class="flex-center nd-analysis">
      <div class="nd-analysis-r">
        <div class="flex-center flex-between">
          <span class="nd-analysis-title"
            >上报{{ filterConfig.typeListName[filterConfig.type] }}</span
          >

          <ChartType
            :data="displayMode('bar')"
            v-model="state.eventVolumeChartType" />
        </div>
        <Chart
          v-if="state.eventVolumeChartType === 'bar'"
          height="340px"
          ref="chartRef"
          :options="eventVolumeData" />
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
          :footer-data="eventVolumeData.footerData"
          :data="eventVolumeData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of eventVolumeData.columns"
            :field="item.prop"
            :key="item.prop"
            :align="item.align">
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
          <span class="nd-analysis-title"
            >{{ filterConfig.typeListName[filterConfig.type] }}总趋势</span
          >

          <ChartType
            :data="displayMode('line')"
            v-model="state.trendChartType" />
        </div>
        <Chart
          v-if="state.trendChartType === 'line'"
          height="340px"
          ref="chartRef"
          :options="trendData" />
        <vxe-table
          v-else
          border
          ref="vxeTableRef"
          class="nd-vxe-table-custom nd-vxe-column-center"
          max-height="340px"
          auto-resize
          show-overflow
          show-header-overflow
          show-footer
          :footer-data="trendData.footerData"
          :footer-row-style="() => 'background-color: #f6f6f9'"
          :row-config="{ isHover: true }"
          :column-config="{ resizable: true }"
          :data="trendData.tableData"
          :scroll-x="{ enabled: true, gt: 10 }"
          :scroll-y="{ enabled: true, gt: 100 }">
          <vxe-column
            sortable
            :title="item.title"
            v-for="item of trendData.columns"
            :field="item.prop"
            :key="item.prop"
            :align="item.align">
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
    <div
      class="gap20"
      style="display: flex; flex-direction: row; flex-wrap: wrap">
      <div
        v-for="(companyItem, index) in state.companyTrendData"
        :key="index"
        class="flex-center nd-analysis nd-analysis-50">
        <div class="nd-analysis-r">
          <div class="flex-center flex-between">
            <span class="nd-analysis-title"
              >{{ companyItem.title }}各应用{{
                filterConfig.typeListName[filterConfig.type]
              }}上报趋势</span
            >

            <ChartType
              :data="displayMode('line')"
              v-model="companyItem.trendChartType" />
          </div>
          <Chart
            v-if="companyItem.trendChartType === 'line'"
            height="340px"
            ref="chartRef"
            :options="companyItem.options" />
          <vxe-table
            v-else
            border
            :ref="`vxeTableRef${index}`"
            class="nd-vxe-table-custom nd-vxe-column-center"
            max-height="340px"
            auto-resize
            show-overflow
            show-header-overflow
            show-footer
            :footer-data="companyItem.footerData"
            :footer-row-style="() => 'background-color: #f6f6f9'"
            :row-config="{ isHover: true }"
            :column-config="{ resizable: true }"
            :data="companyItem.tableData"
            :scroll-x="{ enabled: true, gt: 10 }"
            :scroll-y="{ enabled: true, gt: 100 }">
            <vxe-column
              sortable
              :title="item.title"
              v-for="item of companyItem.columns"
              :field="item.prop"
              :key="item.prop"
              :align="item.align">
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
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { past7DayEnd, past7DayStart } from '@/enumeration/date.js'
import ChartType from '@/views/analysis/components/AnalysisMain/ChartType.vue'
import { displayMode } from '../utils.js'
import SelectCompany from '@/views/operation/operation-analysis/components/SelectCompany.vue'
import { debounce } from 'lodash-es'
import { setWeekEndMark } from '@/components/Chart/utils.js'
import { chartColor } from '@/enumeration/chart.js'
import { thousandsFilter } from '@/utils/index.js'
import Tooltip from './components/Tooltip.vue'
import { asyncGetEventReport } from '@/api/modules/operation-analysis.js'
import { mapFooterData } from '../utils.js'

const state = reactive({
  dateRange: {
    date: [past7DayStart, past7DayEnd],
    diff: '',
  },
  eventVolumeChartType: 'bar',
  trendChartType: 'line',
  chartData: {
    submitEventXAxisDataList: [],
    submitEventYAxisByDateDataList: [],
    eventTrendXAxisDataList: [],
    eventTrendYAxisByDateDataList: [],
    companyStackBarByDateDataList: [],
  },
  companyTrendData: [],
  loading: false,
})

const filterConfig = reactive({
  dateRange: {
    date: [past7DayStart, past7DayEnd],
    diff: '',
  },
  companyCodeList: [],
  type: 0,
  typeListName: ['事件量', '用户日活'],
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
    // backgroundColor: '#F5F7FE',
    // left: '10%',
    // right: '10%',
    // width: '90%',
    // animation: false,
    // rangeMode: ['value', 'value'],
    // handleSize: 0,
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

const eventVolumeData = computed(() => {
  if (state.eventVolumeChartType === 'table') {
    const columns = [
      {
        title: '企业',
        prop: `enterprises`,
        footer: '汇总/平均',
      },
      {
        title: `上报${filterConfig.typeListName[filterConfig.type]}`,
        prop: `total`,
        align: 'right',
        footer: thousandsFilter(
          state.chartData.submitEventXAxisDataList.reduce((p, c, index) => {
            p += state.chartData.submitEventYAxisByDateDataList[index].total
            return p
          }, 0)
        ),
      },
    ]
    return {
      columns,
      tableData: state.chartData.submitEventXAxisDataList.map((item, index) => {
        return {
          enterprises: item.targetDescription,
          total: state.chartData.submitEventYAxisByDateDataList[index].total,
        }
      }),
      footerData: mapFooterData(columns),
    }
  }
  return {
    ...options,
    tooltip: {
      trigger: 'axis',
      enterable: true, //鼠标可进入提示框浮层中
      confine: true, //将 tooltip 框限制在图表的区域内
      axisPointer: {
        type: 'shadow',
      },
    },

    xAxis: {
      ...options.xAxis,
      axisLabel: {
        ...options.xAxis.axisLabel,
        show: true,
        rotate: 35,
      },
      data: state.chartData.submitEventXAxisDataList.map(
        (item) => item.targetDescription
      ),
    },
    series: [
      {
        name: `上报${filterConfig.typeListName[filterConfig.type]}`,
        type: state.eventVolumeChartType,
        barGap: 0,
        label: {
          show: true,
          position: 'top',
          formatter(params) {
            return thousandsFilter(params.value)
          },
        },
        emphasis: {
          focus: 'series',
        },
        // 设置柱子最大宽度为 30
        barMaxWidth: 30,
        itemStyle: {
          color: chartColor[0],
        },
        data: state.chartData.submitEventYAxisByDateDataList.map(
          (item) => item.total
        ),
      },
    ],
    graphic: {
      ...options.graphic,
      invisible: !!state.chartData.submitEventXAxisDataList.length,
    },
  }
})

const fillData = (data) => {
  const allTargetNames = Array.from(
    new Set(data.flat().map((item) => item.targetName))
  ).sort()

  return data.map((subArray) => {
    const existingNames = new Set(subArray.map((item) => item.targetName))
    const filledSubArray = [...subArray]

    allTargetNames.forEach((name) => {
      if (!existingNames.has(name)) {
        filledSubArray.push({
          targetName: name,
          total: 0,
          appList: [],
        })
      }
    })
    // 保证所有数据的顺序一致
    filledSubArray.sort(
      (a, b) =>
        allTargetNames.indexOf(a.targetName) -
        allTargetNames.indexOf(b.targetName)
    )

    return filledSubArray
  })
}

const convertData = (data) => {
  // 使用 Map 改写，初始化一个 Map 对象
  const resultMap = fillData(data).reduce((map, item) => {
    item.forEach((entry) => {
      if (map.has(entry.targetName)) {
        map.get(entry.targetName).push({
          value: entry.total,
          appList: entry.appList,
        })
      } else {
        map.set(entry.targetName, [
          {
            value: entry.total,
            appList: entry.appList,
          },
        ])
      }
    })
    return map
  }, new Map())
  // 将 Map 转换为数组形式的结果
  return Array.from(resultMap, ([key, value]) => ({
    name: key,
    type: state.trendChartType,
    smooth: true,
    emphasis: {
      focus: 'series',
    },
    data: value,
  }))
}

const trendData = computed(() => {
  if (state.trendChartType === 'table') {
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
        title: '应用',
        prop: `appName`,
        footer: '-',
      },
      {
        title: `上报${filterConfig.typeListName[filterConfig.type]}`,
        prop: `total`,
        align: 'right',
        footer: thousandsFilter(
          state.chartData.eventTrendYAxisByDateDataList.reduce((p, c) => {
            p += c.total
            return p
          }, 0)
        ),
      },
    ]
    return {
      columns,
      /*tableData: fillData(state.chartData.companyStackBarByDateDataList).reduce(
        (p, c, i) => {
              c.forEach((sub) => {
            const date =
              state.chartData.eventTrendXAxisDataList[i].targetDescription
            if (sub.appList.length) {
              sub.appList.forEach((app) => {
                p.push({
                  date,
                  appName: app.targetName,
                  enterprises: sub.targetName,
                  total: app.total,
                })
              })
            } else {
              p.push({
                date,
                appName: '-',
                enterprises: sub.targetName,
                total: sub.total,
              })
            }
          })
          return p
        },
        []
      ),*/
      tableData: state.chartData.companyStackBarByDateDataList.reduce(
        (p, c, i) => {
          c.forEach((sub) => {
            const date =
              state.chartData.eventTrendXAxisDataList[i].targetDescription
            if (sub.appList.length) {
              sub.appList.forEach((app) => {
                p.push({
                  date,
                  appName: app.targetName,
                  enterprises: sub.targetName,
                  total: app.total,
                })
              })
            } else {
              p.push({
                date,
                appName: '-',
                enterprises: sub.targetName,
                total: sub.total,
              })
            }
          })
          return p
        },
        []
      ),
      footerData: mapFooterData(columns),

      /* 统计tableData的数据合并行
      const resultMap = data.reduce((map, entry) => {
        if (map.has(entry.date)) {
          map.set(entry.date, map.get(entry.date) + 1);
        } else {
          map.set(entry.date, 1);
        }
        return map;
      }, new Map());
      console.log(resultMap)

      const mergeCells = [];
      let currentRow = 0;

      resultMap.forEach((rowCount, date) => {
        mergeCells.push({ row: currentRow, col: 0, rowspan: rowCount, colspan: 1 });
        currentRow += rowCount;
      });

      console.log(mergeCells);*/

      //    :mergeCells="trendData.mergeCells"
      // mergeCells: [],
    }
  }
  const xData = state.chartData.eventTrendXAxisDataList.map(
    (item) => item.targetDescription
  )
  const datas = []
  state.chartData.companyStackBarByDateDataList.forEach((item, index) => {
    const totals = item.reduce((p, c, i) => {
      p += c.total
      return p
    }, 0)
    datas.push(totals)
  })
  const dataList = [
    {
      type: 'line',
      data: datas,
    },
  ]
  return {
    ...options,
    tooltip: {
      trigger: 'axis',
      // alwaysShowContent: true,
      enterable: true, //鼠标可进入提示框浮层中
      confine: true, //将 tooltip 框限制在图表的区域内
      axisPointer: {
        type: 'shadow',
      },
    },

    xAxis: {
      ...options.xAxis,
      data: xData,
    },
    series: setWeekEndMark(xData, dataList),
    graphic: {
      ...options.graphic,
      invisible: !!xData.length,
    },
  }
})

/**
 * 各个公司应用明细数据
 */
const companyTrendHandle = () => {
  const companyList = convertData(state.chartData.companyStackBarByDateDataList)
  companyList.forEach((item) => {
    let dataList = []
    item.data.forEach((items, indexs) => {
      dataList.push(items.appList)
    })
    dataList = convertData(dataList)

    //表格
    const columns = [
      {
        title: '日期',
        prop: `date`,
        footer: '汇总/平均',
      },
      {
        title: '应用',
        prop: `appName`,
        footer: '-',
      },
      {
        title: `上报${filterConfig.typeListName[filterConfig.type]}`,
        prop: `total`,
        align: 'right',
        footer: thousandsFilter(
          item.data.reduce((p, c) => {
            p += c.value
            return p
          }, 0)
        ),
      },
    ]
    const tables = {
      columns,
      tableData: item.data.reduce((p, c, i) => {
        const date =
          state.chartData.eventTrendXAxisDataList[i].targetDescription
        if (c.appList.length) {
          c.appList.forEach((app) => {
            p.push({
              date,
              appName: app.targetName,
              total: app.total,
            })
          })
        } else {
          p.push({
            date,
            appName: '-',
            enterprises: c.targetName,
            total: c.total,
          })
        }
        return p
      }, []),
      footerData: mapFooterData(columns),
    }

    //图表
    const xData = state.chartData.eventTrendXAxisDataList.map(
      (item) => item.targetDescription
    )
    state.companyTrendData.push({
      title: item.name,
      trendChartType: 'line',
      ...tables,
      options: {
        ...options,
        legend: {
          type: 'scroll',
          itemHeight: 10,
          itemWidth: 10,
          icon: 'circle',
        },
        tooltip: {
          trigger: 'item',
          // alwaysShowContent: true,
          enterable: true, //鼠标可进入提示框浮层中
          confine: true, //将 tooltip 框限制在图表的区域内
          className: 'overflow-auto max-h-300',
          axisPointer: {
            type: 'shadow',
          },
        },

        xAxis: {
          ...options.xAxis,
          data: xData,
        },
        series: setWeekEndMark(xData, dataList),
        graphic: {
          ...options.graphic,
          invisible: !!xData.length,
        },
      },
    })
  })
}

const getReport = async () => {
  state.loading = true
  try {
    filterConfig.type = Number(localStorage.getItem('projectType'))

    const { data } = await asyncGetEventReport({
      companyCodeList: filterConfig.companyCodeList,
      startDate: filterConfig.dateRange.date[0],
      endDate: filterConfig.dateRange.date[1],
      type: filterConfig.type,
    })
    state.chartData = data
    state.companyTrendData.splice(0, state.companyTrendData.length)
    companyTrendHandle()
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
  name: 'EventVolumeAnalysis',
})
</script>

<style scoped lang="scss">
@import '../index.scss';
</style>
