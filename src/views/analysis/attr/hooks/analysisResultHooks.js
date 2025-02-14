import { computed, nextTick, reactive, ref, watch } from 'vue'
import { barChartOptions, pieChartOptions } from './chartOptions'
import {
  chartTypeMap,
  graphTypeMap,
} from '@/views/analysis/components/AnalysisMain/index.js'
import { comparatorMethods } from '@/views/analysis/hooks/utils.js'
import { t } from '@/locales/i18n'

export function useAnalysisResult(props) {
  /**
   * @description:  绘制echarts
   * @return {*}
   */
  const analysisResult = reactive({
    chartRef: null,
    tableRef: null,
    showEcharts: false,
    resultGenerateTime: '',
    dataQp: '',
    chartData: {},
    chartLoading: false,
    option: barChartOptions(),
    columns: [],
    tableData: [],
    group: [],
    status: -1,
    sortArr: [],
    loading: false,
    errMessage: '',
    sortType: '',
    dataDesc: '',
    noticeFlag: false,
  })

  const chartTypeList = ref([])
  const chartType = ref('bar')

  const sortByDataList = () => {
    const groupDataMap = {}
    const dataSoruce = analysisResult.chartData.dataList
    dataSoruce.forEach((item) => {
      const key = item.groupCols.join(',')
      groupDataMap[key] = item.values
    })

    const comparator = comparatorMethods(analysisResult.sortType, groupDataMap)

    if (typeof comparator === 'function') {
      dataSoruce.sort((a, b) =>
        comparator(a['groupCols'].join(','), b['groupCols'].join(','))
      )
    }

    return dataSoruce
  }

  /**
   * @description: 格式化数据
   * @return {*}
   */
  const getEchartsData = (list = {}, group, qp, graphType) => {
    if (!Object.keys(list).length) {
      return
    }

    analysisResult.tableData = []
    analysisResult.resultGenerateTime = list.resultGenerateTime
    analysisResult.dataQP = qp
    analysisResult.sortArr = qp.sortArr
    analysisResult.group = group
    analysisResult.chartData = list.analysis
    analysisResult.sortType = qp.sortType || 'descend'
    analysisResult.dataDesc = list?.analysis?.dataDesc || ''
    analysisResult.noticeFlag = true

    const data = sortByDataList()

    analysisResult.status = data.length === 0 ? 0 : 1
    if (data.length === 0) return

    initChartTypeList()

    chartType.value = graphType ? graphTypeMap.get(graphType) : 'bar'

    nextTick(() => {
      renderTableData()
      renderChart(chartType.value)
      setTimeout(() => {
        analysisResult.tableRef
          ?.getTableRef()
          .sortEvent(analysisResult.sortArr || [])
      })
    })
  }

  /**
   * @description: 渲染图标类型
   * @return {*}
   */
  const initChartTypeList = () => {
    if (analysisResult.group.length === 0) {
      chartTypeList.value = chartTypeMap.get('bar')
    } else {
      chartTypeList.value = [
        ...chartTypeMap.get('bar'),
        ...chartTypeMap.get('pie'),
      ]
    }
  }

  const renderChart = (val) => {
    if (val === 'pie') renderPieChart()
    if (val === 'bar') renderBarChart()
  }

  /**
   * @description: 柱状图绘制
   * @return {*}
   */
  const renderBarChart = (isSort) => {
    analysisResult.option = barChartOptions()

    const data = sortByDataList()
    const seriesList = []
    const xAxisList = []

    const { xAxis, chartData, propList } = renderTableData(isSort)

    // 有2个分组
    if (analysisResult.group.length > 1) {
      propList.forEach((prop) => {
        const seriesData = []
        chartData.forEach((item) => {
          seriesData.push(item[prop])
        })
        seriesList.push({
          type: 'bar',
          data: seriesData,
          barMaxWidth: 50,
          name: prop,
          large: true,
          progressiveThreshold: 100,
          largeThreshold: 100,
          progressive: 100,
        })
      })

      analysisResult.option.xAxis.data = xAxis

      // 按数据量排序
      if (['ascend', 'descend'].includes(analysisResult.sortType)) {
        seriesList.sort((a, b) => {
          const a_total = a.data.reduce((next, pre) => next + pre, 0)
          const b_total = b.data.reduce((next, pre) => next + pre, 0)
          if (analysisResult.sortType === 'descend') {
            return b_total - a_total
          }
          if (analysisResult.sortType === 'ascend') {
            return a_total - b_total
          }
        })
      }

      analysisResult.option.series = seriesList
      return
    }

    data.forEach((item) => {
      seriesList.push(item.values)
      const xItem = item.groupCols[0]
      xAxisList.push(xItem)
    })

    analysisResult.option.series = [
      {
        type: 'bar',
        data: seriesList,
        barMaxWidth: 50,
        name: analysisResult.chartData.displayQuotaName,
      },
    ]
    analysisResult.option.xAxis.data = xAxisList
  }

  /**
   * @description: 饼状图绘制
   * @return {*}
   */
  const renderPieChart = () => {
    analysisResult.option = pieChartOptions()

    const data = analysisResult.chartData
    analysisResult.option.title.text = data.displayQuotaName
    if (data.groupNum <= 10) {
      analysisResult.option.series[0].data = data.dataList.map((item) => {
        const obj = {
          name: item.groupCols.join(','),
          value: item.values,
        }
        return obj
      })
    } else {
      const sortList = data.dataList.sort((a, b) => {
        b.values - a.values
      })

      const list = sortList.slice(0, 10).map((item) => {
        const obj = {
          name: item.groupCols.join(','),
          value: item.values,
        }
        return obj
      })
      const sum_other = sortList.slice(10).reduce((a, b) => {
        return a + b.values
      }, 0)

      analysisResult.option.series[0].data = list.concat([
        { name: t('analysis.other'), value: sum_other },
      ])
    }
  }

  watch(chartType, (val) => {
    renderChart(val)
  })

  /**
   * @description: 渲染表格数据
   * @return {*}
   */
  const renderTableData = (isSort) => {
    const data = analysisResult.chartData
    const group = analysisResult.group
    let columns = []
    const propList = []
    if (group.length === 2) {
      data.dataList.forEach((item) => {
        if (!propList.includes(item.groupCols[1])) {
          propList.push(item.groupCols[1])
        }
      })
    }
    const tableData = []
    data.dataList.forEach((item) => {
      const obj = {
        name: item.groupCols[0],
        values: item.values,
      }
      const temp = item.groupCols[1]
      if (group.length === 2) {
        if (columns.every((e) => e.prop !== temp)) {
          columns.push({
            title: temp,
            prop: temp,
            align: 'right',
          })
        }
        propList.forEach((e) => {
          obj[e] = 0
        })
        obj[temp] = item.values
      } else {
        columns = [
          {
            title: data.displayQuotaName,
            prop: `values`,
            align: 'right',
          },
        ]
      }
      let assignBoolean = true
      tableData.forEach((e) => {
        if (e.name === obj.name) {
          e[temp] = item.values
          assignBoolean = false
        }
      })
      if (assignBoolean) {
        tableData.push(obj)
      }
    })

    const obj = {
      title:
        group.length === 0
          ? t('analysis.indicators')
          : group[0].propertyNameDisplay,
      prop: 'name',
      // fixed: 'left',
    }

    columns.unshift(obj)

    if (!isSort) {
      analysisResult.tableData = tableData
      analysisResult.columns = columns
    }

    return {
      xAxis: tableData.map((item) => item.name),
      chartData: tableData,
      propList: propList,
    }
  }

  const isUserCluster = computed(
    () => analysisResult.dataQP.events.analysis === 'A01'
  )

  /**
   * @description: 回显
   * @return {*}
   * @param {*} date
   */
  const echoGlobalFilters = ({ sortArr, sortType }) => {
    analysisResult.sortArr = sortArr
    console.log(sortType, '---------')
    analysisResult.sortType = sortType
  }

  /**
   * @description: 分组排序
   * @return {*}
   */
  const groupSortChange = () => {
    renderBarChart(true)
  }

  return {
    analysisResult,
    isUserCluster,
    chartTypeList,
    chartType,
    getEchartsData,
    echoGlobalFilters,
    groupSortChange,
  }
}
