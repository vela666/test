import { cloneDeep } from 'lodash-es'
import { computed, ref, reactive, watch, nextTick } from 'vue'
import { getActualWidthOfChars, formatDateWithWeek } from '@/utils'
import {
  chartTypeMap,
  graphTypeMap,
} from '@/views/analysis/components/AnalysisMain/index.js'
import { past7DayRange } from '@/enumeration/date'
import { barChartOptions, funnelChartOptions } from './chartOptions'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

export function useFunnelResultHooks(props) {
  const analysisResult = reactive({
    dateRange: past7DayRange,
    status: -1,
    stepOptions: [
      {
        label: t('analysis.funnel.allStep'),
        value: 0,
      },
    ],
    steps: [0],
    groupCheck: [],
    groupOptions: [],
    resultClusterSql: '',
    resultGenerateTime: '',
    dataSource: {}, // 数据源
    dataQP: {},
    chartRef: null,
    analysisTableRef: null,
    options: {},
    tableData: {
      cover: [],
      loss: [],
    },
    columns: {
      cover: [],
      loss: [],
    },
    funnelType: 'cover',
    chartData: [],
    chartWidth: '100%',
    chartBarShowNum: 8,
    dataDesc: '',
    noticeFlag: true,
    CustomTableRef: null,
    loading: false,
    errMessage: '',
  })

  const chartTypeList = ref([
    ...chartTypeMap.get('funnel'),
    ...chartTypeMap.get('bar'),
  ])
  const chartType = ref('funnel')

  const dashboardChartTypeList = computed(() => [
    ...chartTypeList.value,
    ...chartTypeMap.get('table'),
  ])

  /**
   * @description: 格式化图表类型选择
   * @return {*}
   */
  const initTypeList = computed(() => {
    const chartList = []
    dashboardChartTypeList.value.forEach((item) => {
      chartList.push({
        ...item,
        value: item.graphType,
      })
    })

    return chartList
  })

  /**
   * @description: 处理返回数据
   * @return {*}
   */
  const getEchartsData = (data, qp, graphType, type) => {
    analysisResult.tableData = {
      cover: [],
      loss: [],
    }

    analysisResult.columns = {
      cover: [],
      loss: [],
    }

    const { resultClusterSql, resultGenerateTime, analysis } = data
    analysisResult.resultClusterSql = resultClusterSql
    analysisResult.resultGenerateTime = resultGenerateTime
    analysisResult.status =
      !analysis || !analysis.y || analysis.y.length === 0 ? 0 : 1
    analysisResult.dataSource = cloneDeep(analysis)
    analysisResult.dataQP = qp
    analysisResult.dataDesc = analysis?.dataDesc || ''
    analysisResult.noticeFlag = true

    // 暂无数据
    if (!Array.isArray(analysis?.y) || analysis.y.length === 0) {
      analysisResult.groupOptions = []
      return
    }

    if (analysis.x.length > 0) {
      analysisResult.groupOptions = cloneDeep(analysis.x)
      analysisResult.groupOptions.unshift(t('analysis.funnel.total'))
      if (type === 'detail' || type === 'exploreCalc') {
        //详情回选处理填补
        // 1.0系统报表兼容 (qp.groupCheck && qp.groupCheck.groups && !qp.groupCheck.groups.length) || !qp.groupCheck
        if (
          (qp.groupCheck &&
            qp.groupCheck.groups &&
            !qp.groupCheck.groups.length) ||
          !qp.groupCheck ||
          (Array.isArray(qp.groupCheck) && !qp.groupCheck.length)
        ) {
          analysisResult.groupCheck = [
            t('analysis.funnel.total'),
            analysis.x[0],
          ]
        } else {
          let oldGroup = []
          if (qp.groupCheck && qp.groupCheck.groups) {
            oldGroup = qp.groupCheck.groups || []
          } else if (Array.isArray(qp.groupCheck)) {
            oldGroup = qp.groupCheck
          }
          const list = [t('analysis.funnel.total'), ...analysis.x]
          const newGroup = list.filter((item) => oldGroup.includes(item))
          if (newGroup.length !== oldGroup.length) {
            const newGroupOptions = list.filter(
              (item) => !oldGroup.includes(item)
            )
            newGroup.push(
              ...newGroupOptions.slice(0, oldGroup.length - newGroup.length)
            )
          }
          analysisResult.groupCheck = newGroup
        }
      } else if (!type) {
        analysisResult.groupCheck = [t('analysis.funnel.total'), analysis.x[0]]
      }
    } else {
      analysisResult.groupCheck = [t('analysis.funnel.total')]
    }
    chartType.value = graphType
      ? graphType === 3
        ? 'bar'
        : graphTypeMap.get(graphType)
      : 'funnel'

    nextTick(() => {
      // 步骤列表
      renderStepOptions()
      // 表格数据
      renderTableData()
      // 图表数据
      renderChartData()
    })
  }

  /**
   * @description: 获取图表数据
   * @return {*}
   */
  const renderChartData = () => {
    if (analysisResult.status !== 1) return
    chartType.value === 'bar' ? renderBarChart() : renderFunnelChart()
  }

  /**
   * @description: 转化图
   * @return {*}
   */
  const renderBarChart = () => {
    const options = barChartOptions()

    if (analysisResult.chartData.length === 0) return

    options.legend.data = analysisResult.groupCheck
    options.xAxis.data = analysisResult.dataQP.events
      .map(
        (item, i) =>
          `${t('analysis.funnel.step')}${i + 1}: ${item.eventNameDisplay}`
      )
      .slice(stepStart.value, stepEnd.value)

    analysisResult.groupCheck.forEach((val) => {
      const data = analysisResult.chartData.find(
        (item) => item.group === val
      )?.chartData

      if (!data) return

      const seriesData = data?.slice(stepStart.value, stepEnd.value)

      const seriesItem = {
        name: val,
        type: 'bar',
        barMaxWidth: 45,
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(180, 180, 180, 0.2)',
        },
        data: seriesData.map((item, i, arr) => {
          const firstStep = arr[0]
          let percent = 0
          let cover_rate = 0
          if (firstStep && item) {
            const per = item / firstStep
            if (typeof per === 'number') {
              const perNum = per * 100
              percent = perNum === 100 ? perNum : perNum.toFixed(2)
            }
          }
          if (i > 0 && item && arr[i - 1]) {
            const rate = item / arr[i - 1]
            if (typeof rate === 'number') {
              const rateNum = rate * 100
              cover_rate = rateNum === 100 ? rateNum : rateNum.toFixed(2)
            }
          }

          return { value: percent, cover_rate }
        }),
        tooltip: {
          formatter: (params) => {
            const value = seriesData[params.dataIndex]
            const showVal = value?.toLocaleString()
            const showText = `
                      <span style="font-size:14px;">${params.name}</span>
                      <br>
                      ${params.marker} <span style="font-size:12px;">
                      ${params.seriesName}
                      </span>：
                      <span style="font-size:14px;color:#666;">
                      ${params.value + '%'}
                      </span>，
                      <span style="font-size:14px;">${t('analysis.numPeople')}</span>：
                      <span style="font-size:14px;color:#666;">${showVal}</span>`
            return showText
          },
        },
        emphasis: {
          focus: 'series',
        },
      }

      if (analysisResult.dataQP.groupBy.length === 0) {
        seriesItem['label'] = {
          show: true,
          position: 'insideTop',
          lineHeight: 14,
          formatter: (params) => {
            const value = seriesData[params.dataIndex]
            const showVal = value?.toLocaleString()
            const showText =
              params.value > 15 ? `${params.value + '%'}\n${showVal}` : ''
            return showText
          },
        }
      }

      options.series.push(seriesItem)
    })
    nextTick(() => {
      renderChartOptions(options)
    })
  }

  /**
   * @description: 漏斗图
   * @return {*}
   */
  const renderFunnelChart = () => {
    const options = funnelChartOptions()
    const offsetArr = [0, 50, 32, 24]
    const widthArr = ['40%', '40%', '30%', '23%']
    analysisResult.groupCheck.forEach((val, i) => {
      const data = analysisResult.chartData.find((item) => item.group === val)
      if (data) {
        const obj = {
          type: 'funnel',
          name: val,
          width: widthArr[analysisResult.groupCheck.length - 1] || '40%',
          label: {
            show: true,
            position: 'inside',
            formatter: (params) => {
              return `${params.seriesName}-${params.name}`
            },
          },
          emphasis: {
            focus: 'self',
          },
          left:
            analysisResult.groupCheck.length === 1
              ? 'center'
              : i * offsetArr[analysisResult.groupCheck.length - 1] + 5 + '%',
        }

        obj.data = data.chartData
          .map((item, index) => {
            const label = analysisResult.dataQP.events[index].eventNameDisplay
            const i = index + 1
            const new_obj = {
              name: `${t('analysis.funnel.step')}${i}(${label})`,
              value: item,
              label,
              cover_rate_current:
                i === 1 ? (item ? 100 : 0) : data[`cover_rate_current_${i}`],
              cover_rate_total:
                i === 1 ? (item ? 100 : 0) : data[`cover_rate_total_${i}`],
            }

            return new_obj
          })
          .slice(stepStart.value, stepEnd.value)
        options.series.push(obj)
      }
    })

    options.tooltip.formatter = (params) => {
      return `
            <div>
              ${params.marker} ${params.name}: ${
                params.data.cover_rate_current
              }%
            </div>
            <div style="padding-left:15px;">
              <div>
              ${t('analysis.funnel.overallConversionRate')}: <el-icon><Plus /></el-icon>
              ${params.data.cover_rate_total}%
              </div>
              <div>${t('analysis.numPeople')}: ${params.value?.toLocaleString()}</div>
            </div>
           `
    }
    nextTick(() => {
      renderChartOptions(options)
    })
  }

  /**
   * @description: 转化图是否需要设置graphic / 漏斗图超过2个展示滚动条
   * @return {*}
   * @param {*} options
   */
  const renderChartOptions = (options) => {
    const width = analysisResult.chartEleRef?.offsetWidth
    if (chartType.value === 'bar') {
      if (analysisResult.dataQP.groupBy.length === 0) {
        if (
          chartType.value === 'bar' &&
          options.series.length > 0 &&
          options.series[0].data &&
          Array.isArray(options.series[0].data)
        ) {
          options['dataZoom'] = [
            {
              type: 'slider',
              show:
                options.series[0].data.length > analysisResult.chartBarShowNum,
              xAxisIndex: [0],
              realtime: false,
              filterMode: 'filter',
              zoomLock: true,
              brushSelect: false,
              bottom: 0,
              startValue: 0,
              endValue: analysisResult.chartBarShowNum - 1,
              rangeMode: ['value', 'value'],
              handleSize: 0,
              showDetail: false,
              showDataShadow: false,
              height: '4%',
            },
          ]
          let seriesData = options.series[0].data
          // 判断是否有 dataZoom ‘滚动条’
          if (
            options.dataZoom &&
            Array.isArray(options.dataZoom) &&
            options.dataZoom.length > 0
          ) {
            const start = options.dataZoom[0].startValue
            const end = options.dataZoom[0].endValue
            seriesData = seriesData.slice(start, end + 1)
          }
          options.graphic = setGraphic(seriesData)
          if (
            options.series.length > 0 &&
            options.series[0].data.length > analysisResult.chartBarShowNum
          ) {
            // 监听'滚动条'的 datazoom 事件 使得graphic上的值随着滚动改变
            analysisResult.chartRef.myChart.on('datazoom', onDatazoom)
          }
        }
      }

      analysisResult.chartWidth = `${width}px`
    } else {
      // 漏斗图
      const count = analysisResult.groupCheck.length
      if (count > 2) {
        analysisResult.chartWidth = count > 3 ? '1300px' : '1200px'
      } else {
        analysisResult.chartWidth = `${width}px`
      }
    }

    analysisResult.options = options
  }

  const onDatazoom = () => {
    const opt = analysisResult.chartRef.myChart.getOption()
    if (opt.series.length > 0 && opt.dataZoom.length) {
      const start = opt.dataZoom[0].startValue
      const end = opt.dataZoom[0].endValue
      const datas = opt.series[0].data.slice(start, end + 1)
      if (analysisResult.dataQP.groupBy.length === 0) {
        const graphic = setGraphic(datas)
        analysisResult.chartRef.myChart.setOption({
          graphic,
          dataZoom: opt.dataZoom,
        })
      } else {
        analysisResult.chartRef.myChart.setOption({
          dataZoom: opt.dataZoom,
        })
      }
    }
  }

  /**
   * @description: // 设置graphic （没有分组时显示）
   * @return {*}
   */
  const setGraphic = (seriesData) => {
    const elements = []
    if (Array.isArray(seriesData) && seriesData.length > 1) {
      const echartWidth = analysisResult.chartRef.myChart.getWidth()
      // 28 = axisLabel宽度设定为20 + axisLabel与grid的margin默认为8
      // 0.03 = grid 的left 为 3%
      const basedLeft = echartWidth * 0.03 + 30
      const datas = seriesData.slice(1).map((item) => item.cover_rate || 0)
      const gap = (echartWidth * (1 - 0.06) - 28) / seriesData.length
      const topGap = 400 * 0.6 // 五边形左上角点的纵坐标（五边形：宽度50，高度30）
      for (let i = 0, len = datas.length; i < len; i++) {
        const leftGap = basedLeft + gap * (i + 1) - 20
        elements.push({
          type: 'polygon',
          left: leftGap,
          top: '38%',
          textContent: {
            left: 'center',
            top: 'middle',
            style: {
              fill: '#333',
              overflow: 'break',
              text: `${datas[i]}%`,
              font: '12px Microsoft YaHei',
            },
          },
          textConfig: {
            position: 'inside',
          },
          shape: {
            points: [
              [leftGap, topGap],
              [leftGap + 40, topGap],
              [leftGap + 50, topGap - 15],
              [leftGap + 40, topGap - 30],
              [leftGap, topGap - 30],
            ],
          },
          style: {
            fill: '#fff',
            stroke: '#3d90ff',
            lineWidth: 1,
          },
        })
      }
    }
    return elements
  }

  /**
   * @description: 获取步骤列表
   * @return {*}
   */
  const renderStepOptions = () => {
    const data = analysisResult.dataQP.events
    const options = []
    for (let i = 0; i < data.length - 1; i++) {
      const obj = {
        value: i + 1,
        label: `${t('analysis.funnel.step')}${i + 1}`,
        children: [],
      }
      for (let j = i + 1; j < data.length; j++) {
        obj.children.push({
          value: j + 1,
          label: `${t('analysis.funnel.step')}${j + 1}`,
        })
      }

      options.push(obj)
    }

    options.unshift({
      label: t('analysis.funnel.allStep'),
      value: 0,
    })
    if (
      Math.max.apply(null, analysisResult.steps) >
      analysisResult.dataQP.events.length
    ) {
      analysisResult.steps = [0]
    }

    analysisResult.stepOptions = options
  }

  /**
   * @description: 获取表格数据 默认是转化(cover)  流失(loss)
   * @return {*}
   */
  const renderTableData = () => {
    analysisResult.funnelType === 'cover' ? renderCoverData() : renderLossData()
    // 获取可视化图表数据
    analysisResult.chartData = getChartDataList()
  }

  const stepStart = computed(() => {
    return analysisResult.steps.length > 1
      ? analysisResult.steps[0] - 1
      : analysisResult.steps[0]
  })

  const stepEnd = computed(() => {
    return analysisResult.steps.length > 1
      ? analysisResult.steps[1]
      : analysisResult.dataQP.events?.length
  })

  /**
   * @description: 表格数据 -- 转化
   * @return {*}
   */
  const renderCoverData = () => {
    const groupBy = analysisResult.dataQP.groupBy
    const events = analysisResult.dataQP.events
    const columns = []
    events.forEach((item, i) => {
      if (i >= stepStart.value && i < stepEnd.value) {
        columns.push({
          title: `${item.eventNameDisplay}(${t('analysis.funnel.step')}${i + 1})`,
          align: 'right',
          prop: `${analysisResult.funnelType}_${i + 1}`,
        })
      }
    })
    columns.unshift({
      title:
        groupBy.length === 0
          ? t('analysis.funnel.total')
          : groupBy[0].propertyNameDisplay,
      prop: 'group',
      // fixed: 'left',
    })

    analysisResult.columns[analysisResult.funnelType] = columns
    analysisResult.tableData[analysisResult.funnelType] =
      getChartDataList('table')
  }

  /**
   * @description: 获取可视化图表数据
   * @return {*}
   */
  const getChartDataList = (type = 'chart') => {
    const chartData = []
    const groupBy = analysisResult.dataQP.groupBy
    const dataList = analysisResult.dataSource?.y[0]
    const list = dataList ? [dataList.totalValues, ...dataList.itemValues] : []

    list.forEach((item, j) => {
      const obj = {}
      obj.chartData =
        type === 'chart' ? item : item.slice(stepStart.value, stepEnd.value)
      obj.group =
        groupBy.length === 0 || j == 0
          ? t('analysis.funnel.total')
          : analysisResult.dataSource?.x[j - 1]

      obj.chartData.forEach((item, i, arr) => {
        obj[`cover_${i + 1}`] = item

        if (i > 0) {
          // 分步转化率（当前步骤/上一步骤）
          const cover_rate_current = arr[i - 1]
            ? ((arr[i] / arr[i - 1]) * 100).toFixed(2)
            : 0

          // 步骤一到当前步骤转化率（当前步骤/步骤一）
          const cover_rate_total = arr[0]
            ? ((arr[i] / arr[0]) * 100).toFixed(2)
            : 0

          obj[`cover_rate_current_${i + 1}`] = Number(cover_rate_current)
          obj[`cover_rate_total_${i + 1}`] = Number(cover_rate_total)
        }
      })

      chartData.push(obj)
    })

    return chartData
  }

  /**
   * @description: 表格数据 -- 流失
   * @return {*}
   */
  const renderLossData = () => {
    const groupBy = analysisResult.dataQP.groupBy
    const events = analysisResult.dataQP.events
    const dataList = analysisResult.dataSource.y[0]
    const columns = []
    const tableData = []

    events.forEach((item, i) => {
      if (i >= stepStart.value && i < stepEnd.value) {
        columns.push({
          title:
            stepStart.value === i
              ? `${item.eventNameDisplay}(${t('analysis.funnel.step')}${i + 1})`
              : `${item.eventNameDisplay}(${t('analysis.funnel.stepTo', [i, i + 1])})`,
          align: 'right',
          prop: `${analysisResult.funnelType}_${i + 1}`,
        })
      }
    })
    columns.unshift({
      title:
        groupBy.length === 0
          ? t('analysis.funnel.total')
          : groupBy[0].propertyNameDisplay,
      prop: 'group',
      // fixed: 'left',
    })

    const list = dataList ? [dataList.totalValues, ...dataList.itemValues] : []
    list.forEach((item, j) => {
      const obj = {}
      obj.group =
        groupBy.length === 0 || j == 0
          ? t('analysis.funnel.total')
          : analysisResult.dataSource?.x[j - 1]

      item.slice(stepStart.value, stepEnd.value).forEach((item, i, arr) => {
        obj[`loss_${i + 1}`] = item

        if (i > 0) {
          obj[`loss_${i + 1}`] = arr[i - 1] - arr[i]
          // 分步流失（当前步骤与上一步骤之间）
          const loss_rate_current = arr[i - 1]
            ? (100 - (arr[i] / arr[i - 1]) * 100).toFixed(2)
            : 0

          // 步骤一到当前步骤流失率
          const loss_rate_total = arr[0]
            ? (((arr[0] - arr[i]) / arr[0]) * 100).toFixed(2)
            : 0

          obj[`loss_rate_current_${i + 1}`] = Number(loss_rate_current)
          obj[`loss_rate_total_${i + 1}`] = Number(loss_rate_total)
        }
      })

      tableData.push(obj)
    })

    analysisResult.columns[analysisResult.funnelType] = columns
    analysisResult.tableData[analysisResult.funnelType] = tableData

    console.log(tableData)
  }

  watch(
    () => analysisResult.funnelType,
    (val) => {
      if (JSON.stringify(analysisResult.dataSource) === '{}') return
      val === 'cover' ? renderCoverData() : renderLossData()
      // 获取可视化图表数据
      analysisResult.chartData = getChartDataList()
    }
  )

  const getStepTitle = computed(() => {
    if (analysisResult.steps.length === 2) {
      return t('analysis.funnel.stepTitle', [
        analysisResult.steps[0],
        analysisResult.steps[1],
      ])
      // return `从步骤${analysisResult.steps[0]}到步骤${analysisResult.steps[1]}`
    }
    return t('analysis.funnel.allStep')
  })

  /**
   * @description: 获取步骤文字宽度
   * @return {*}
   */
  const stepLabelWidth = computed(() => {
    let label = ''
    const list = getStepLabel(cloneDeep(analysisResult.stepOptions))

    analysisResult.steps.forEach((item) => {
      label += list.find((val) => val.value === item)?.label
    })
    let width = getActualWidthOfChars(label, { size: 14 })
    analysisResult.steps.length === 1 ? (width += 44) : (width += 60)

    return width
  })

  /**
   * @description: 获取步骤文字宽度
   * @return {*}
   */
  const dashboardStepLabelWidth = computed(() => {
    let label = ''
    const list = getStepLabel(cloneDeep(analysisResult.stepOptions))

    analysisResult.steps.forEach((item) => {
      label += list.find((val) => val.value === item)?.label || ''
    })
    let width = getActualWidthOfChars(label, { size: 14 })
    analysisResult.steps.length === 1 ? width : (width += 16)

    return width
  })

  /**
   * @description: 获取步骤名称
   * @return {*}

   */
  const getStepLabel = (tree) => {
    let list = []
    let queue = [...tree]

    while (queue.length) {
      const node = queue.shift()
      const children = node.children
      if (children && children.length) {
        queue.push(...children)
      }
      delete node.children
      list.push(node)
    }

    return list
  }

  /**
   * @description: 改变步骤
   * @return {*}
   */
  const handleStepChange = () => {
    renderTableData()
    renderChartData()
  }

  watch([() => chartType.value, () => analysisResult.groupCheck], () => {
    renderChartData()
  })

  /**
   * @description: 导出报表
   * @return {*}
   */
  const download = () => {
    recordBehavior({
      moduleName: '分析',
      submoduleName: '漏斗分析',
      operate: '导出报表数据',
      businessId: props.info?.businessId,
    })
    const tableData = analysisResult.tableData[analysisResult.funnelType]
    const columns = analysisResult.columns[analysisResult.funnelType]

    const fileHeader = []
    const fileData = []
    const label =
      analysisResult.funnelType === 'cover'
        ? t('analysis.funnel.conversion')
        : t('analysis.funnel.loss')
    columns.forEach((item, i) => {
      fileHeader.push(item.title)
      if (i > 1) {
        fileHeader.push(`${item.title} ${label}`)
      }
    })

    fileHeader.unshift(t('common.date'))

    tableData.forEach((item) => {
      const list = ['-', item.group]

      for (let i = 1; i <= columns.length - 1; i++) {
        list.push(item[`${analysisResult.funnelType}_${i}`])
        if (i > 1) {
          list.push(
            item[`${analysisResult.funnelType}_rate_current_${i}`] +
              '%\n' +
              `${item[analysisResult.funnelType + '_rate_total_' + i]}%`
          )
        }
      }

      fileData.push(list)

      // 日期分组详情数据
      const groupData = getGroupData(item.group)

      groupData.forEach((val) => {
        const groupList = []
        groupList.push(formatDateWithWeek(val.groupCols), item.group)
        val.values
          .slice(stepStart.value, stepEnd.value)
          .forEach((item, i, arr) => {
            groupList.push(item)

            if (i > 0) {
              // 分步转化率（当前步骤/上一步骤）
              const cover_rate_current = arr[i - 1]
                ? ((arr[i] / arr[i - 1]) * 100).toFixed(2)
                : 0

              // 步骤一到当前步骤转化率（当前步骤/步骤一）
              const cover_rate_total = arr[0]
                ? ((arr[i] / arr[0]) * 100).toFixed(2)
                : 0

              // 分步流失（当前步骤与上一步骤之间）
              const loss_rate_current = arr[i - 1]
                ? (100 - (arr[i] / arr[i - 1]) * 100).toFixed(2)
                : 0

              // 步骤一到当前步骤流失率
              const loss_rate_total = arr[0]
                ? (((arr[0] - arr[i]) / arr[0]) * 100).toFixed(2)
                : 0

              const rate =
                analysisResult.funnelType === 'cover'
                  ? cover_rate_current + '%\n' + `${cover_rate_total}%`
                  : loss_rate_current + '%\n' + `${loss_rate_total}%`
              groupList.push(rate)
            }
          })

        fileData.push(groupList)
      })
    })

    analysisResult.analysisTableRef.exportExcel({
      fileHeader,
      fileData,
    })
  }

  /**
   * @description: 获取日期分组详情数据
   * @return {*}
   */
  const getGroupData = (groupName) => {
    let data = []
    if (groupName === t('analysis.funnel.total')) {
      data = analysisResult.dataSource.y[0].totalGroupValues
    } else {
      const i = analysisResult.dataSource.x.findIndex(
        (item) => item === groupName
      )
      data = analysisResult.dataSource.y[0].itemGroupValues[i]
    }

    return data
  }

  /**
   * @description: 保存草稿--回显时间
   * @return {*}
   */
  const echoGlobalFilters = ({ dateRange, steps, funnelType, groupCheck }) => {
    analysisResult.dateRange = {
      ...dateRange,
      shortcutType: dateRange.shortcutType ?? '',
    }
    analysisResult.steps = steps || [0]
    analysisResult.funnelType = funnelType || 'cover'
    analysisResult.groupCheck = groupCheck
  }

  /**
   * @description: 错误信息处理
   */
  const setErrMessage = (msg = '') => {
    analysisResult.errMessage = msg
  }

  return {
    analysisResult,
    stepLabelWidth,
    chartType,
    chartTypeList,
    getStepTitle,
    stepStart,
    stepEnd,
    onDatazoom,
    renderChartData,
    handleStepChange,
    getEchartsData,
    download,
    echoGlobalFilters,
    initTypeList,
    dashboardChartTypeList,
    dashboardStepLabelWidth,
    setErrMessage,
  }
}
