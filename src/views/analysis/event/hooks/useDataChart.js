import { cloneDeep } from 'lodash-es'
import { strip } from '@/utils'
import {
  initOptions,
  toolTipFormatter,
  fillData,
  roundObj,
  initPieOptions,
  setWeekEndMark,
  lineType,
  trendAndCumulativeFormatter,
  distributedFormatter,
  dataZoomOption,
  customExtraCssText,
  generateRandomColor,
  sortTypeValues,
  comparatorMethods,
  getNoneGroups,
  getGroupOrderByAmount,
} from '@/views/analysis/hooks/utils.js'
import { t } from '@/locales/i18n'

export default function (state, dataChartCache, dataCache) {
  // 图表分组排序方法
  const groupComparator = () => {
    if (!state.unionGroups.length || !sortTypeValues.includes(state.sortType))
      return
    const dataCache = cloneDeep(dataChartCache.value)
    if (
      !Array.isArray(dataCache.y) ||
      !dataCache?.y?.length ||
      !Array.isArray(dataCache.unionGroups)
    )
      return
    let groupDataMap = {}
    // 获取 values 数组的长度
    const len =
      Array.isArray(dataCache.y[0].item) &&
      Array.isArray(dataCache.y[0].item[0].values)
        ? dataCache.y[0].item[0].values.length
        : 0

    // 获取对比阶段数组的长度
    const valuesComparedList = Array.isArray(
      dataCache.y[0].item[0].values_compared_list
    )
      ? dataCache.y[0].item[0].values_compared_list
      : []

    dataCache.y.forEach((cache, index) => {
      const neededed = getNoneGroups(cache.item, dataCache.unionGroups)
      if (neededed.length) {
        for (const need of neededed) {
          dataChartCache.value.y[index].item.push({
            groupCols: need,
            groupNum: null,
            values: new Array(len).fill(0),
            values_compared_list: valuesComparedList.map((innerArray) =>
              innerArray.map((obj) => ({ comparedValue: 0 }))
            ),
          })
        }
      }
    })

    // 当按数据量排序时需要处理数据
    if (['ascend', 'descend'].includes(state.sortType)) {
      groupDataMap = getGroupOrderByAmount(dataCache, state.versus)
    }
    const comparator = comparatorMethods(state.sortType, groupDataMap)

    if (typeof comparator === 'function') {
      // 分组下拉选项整体排序
      state.unionGroups.sort(comparator)
      // 勾选默认时按当前顺序选择分组
      if (state.groupOptions.groupCheckAll) {
        state.groupOptions.groupCheckList = state.unionGroups.slice(
          0,
          state.groupOptions.customNum
        )
      }

      // 排序dataChartCache 里面的每个事件的数据
      dataChartCache.value.y.forEach((cache) => {
        if (Array.isArray(cache.item) && cache.item.length > 0) {
          cache.item.sort((a, b) => comparator(a['groupCols'], b['groupCols']))
        }
      })
    }
  }

  const setCustomChartDataZoom = (xData = []) => {
    state.options['dataZoom'] =
      xData.length > 7 ? { ...dataZoomOption } : undefined
    state.options.legend.bottom =
      xData.length > 7 ? '4%' : initOptions().legend.bottom
  }

  //是否包含分组
  const isIncludesGroupCols = (
    groupCheckList = [],
    unionGroups = [],
    groupCols = ''
  ) => {
    const len = unionGroups?.length ?? 0
    return len > 0 ? groupCheckList.includes(groupCols) : true
  }

  //趋势图或堆积图
  const setLineOrAreaChart = () => {
    const eventCheckList = state.eventCheckList
    const groupCheckList = state.groupOptions.groupCheckList
    const data = cloneDeep(dataChartCache.value)
    let series = []
    const legendData = []
    //堆积图
    const isStack = state.graphType === 4
    data?.y?.forEach((item) => {
      if (eventCheckList.includes(item.eventName)) {
        item.item.forEach((childItem, i) => {
          if (
            isIncludesGroupCols(
              groupCheckList,
              data.unionGroups,
              childItem.groupCols
            )
          ) {
            const name =
              item.eventName +
              (childItem.groupCols ? '.' + childItem.groupCols : '')
            const chartName =
              typeof name === 'string' ? name.replace(/~/g, ',') : `${name}`
            let seriesItem = {
              type: 'line',
              data: childItem.values.map((el) => ({
                value: el,
                round: item.round,
              })),
              name: chartName,
              emphasis: {
                focus: 'series',
              },
              label: {
                show: state.showChartLabel,
                position: 'top',
              },
              tooltip: {
                formatter: (params) => {
                  return toolTipFormatter(params, item.round)
                },
              },
            }
            if (isStack) {
              seriesItem = {
                ...seriesItem,
                stack: t('analysis.event.total'),
                areaStyle: {},
              }
            }
            series.push(seriesItem)
            legendData.push(chartName)
          }
        })
      }
    })
    const dateXData = Array.isArray(data.x) ? [...data.x] : []
    if (state.particleType.particle === 'day') {
      series = setWeekEndMark(dateXData, series)
    }

    state.options.xAxis.data = dateXData
    state.options.series = [...series]
    state.options.legend.data = [...legendData]
    setCustomChartDataZoom(dateXData)
  }

  //累计图
  const setTotalBarChart = () => {
    const eventCheckList = state.eventCheckList
    const groupCheckList = state.groupOptions.groupCheckList
    const data = cloneDeep(dataChartCache.value)
    let series = []
    const legendData = []

    data?.y?.forEach((item) => {
      const round =
        roundObj[item.round] === undefined ? 2 : roundObj[item.round]
      if (eventCheckList.includes(item.eventName)) {
        item.item.forEach((childItem, i) => {
          // groupCheckList 当前选中要展示的分组
          if (
            isIncludesGroupCols(
              groupCheckList,
              data.unionGroups,
              childItem.groupCols
            )
          ) {
            // 拼接名字
            const name =
              item.eventName +
              (childItem.groupCols ? '.' + childItem.groupCols : '')
            series.push({
              type: 'line',
              data: childItem.values
                .map((val, index, arr) => {
                  // 每次循环获取索引0开始到索引index + 1的元素, 不包括index + 1的元素
                  const totalNum = arr
                    .slice(0, index + 1)
                    .reduce((acc, cur) => {
                      return acc + cur
                    }, 0)
                  return parseFloat(totalNum.toFixed(round))
                })
                .map((el) => ({ value: el, round: item.round })),
              name: typeof name === 'string' ? name.replace(/~/g, ',') : name,
              emphasis: {
                focus: 'series',
              },
              tooltip: {
                formatter: (params) => {
                  return toolTipFormatter(params, item.round)
                },
              },
              label: {
                show: state.showChartLabel,
                position: 'top',
              },
            })
            legendData.push(
              typeof name === 'string' ? name.replace(/~/g, ',') : name
            )
          }
        })
      }
    })
    const dateXData = Array.isArray(data.x) ? [...data.x] : []
    if (state.particleType.particle === 'day') {
      series = setWeekEndMark(dateXData, series)
    }
    state.options.xAxis.data = dateXData
    state.options.series = [...series]
    state.options.legend.data = [...legendData]
    setCustomChartDataZoom(dateXData)
  }

  //分布图
  const setBarChart = () => {
    const eventCheckList = state.eventCheckList
    const groupCheckList = state.groupOptions.groupCheckList
    const data = cloneDeep(dataChartCache.value)
    const xAxisData = []
    let series = []
    const legendData = []
    const roundMap = {}
    // 按照是否有分组判断
    if (!data.groupColumn) {
      legendData.push(t('analysis.event.total'))
      series = [
        {
          name: t('analysis.event.total'),
          type: 'bar',
          data: [],
          barWidth: '10%',
          barMaxWidth: '40px',
          label: {
            show: state.showChartLabel,
            position: 'top',
          },
        },
      ]
      data?.y?.forEach((cache) => {
        roundMap[cache.eventName] = {}
        roundMap[cache.eventName]['round'] = cache.round
        const round =
          roundObj[cache.round] === undefined ? 2 : roundObj[cache.round]
        if (eventCheckList.includes(cache.eventName)) {
          xAxisData.push(cache.eventName)
          cache.item.forEach((val) => {
            if (
              isIncludesGroupCols(
                groupCheckList,
                data.unionGroups,
                val.groupCols
              )
            ) {
              const totalNum = val.values.reduce((acc, cur) => {
                return acc + cur
              }, 0)
              series[0].data.push({
                value: parseFloat(totalNum.toFixed(round)),
                round: cache.round,
              })
              series[0]['tooltip'] = {
                formatter: (params) => {
                  const name = params.name
                  return toolTipFormatter(params, roundMap[name]['round'])
                },
              }
            }
          })
        }
      })
      state.options.xAxis.data = xAxisData
      state.options.series = [...series]
      state.options.legend.data = [...legendData]
      setCustomChartDataZoom(xAxisData)
    } else {
      setBarByGroup(data)
    }
  }

  // 设置分布图（有分组的情况）
  const setBarByGroup = (dataCache) => {
    const eventCheckList = state.eventCheckList
    const groupCheckList = state.groupOptions.groupCheckList
    const tempData = {}
    const roundMap = {}
    const xAxisData = []
    // 按事件分组
    dataCache?.y?.forEach((cache) => {
      if (eventCheckList.includes(cache.eventName)) {
        xAxisData.push(cache.eventName)
        // 使用 Map 而不使用 {} , 避免数字做键值时浏览器给对象中的键重新排序
        tempData[cache.eventName] = new Map()
        roundMap[cache.eventName] = {}
        roundMap[cache.eventName]['round'] = cache.round
        const round =
          roundObj[cache.round] === undefined ? 2 : roundObj[cache.round]
        cache.item.forEach((val) => {
          if (
            isIncludesGroupCols(
              groupCheckList,
              dataCache.unionGroups,
              val.groupCols
            )
          ) {
            const totalNum = val.values.reduce((acc, cur) => {
              return acc + cur
            }, 0)
            tempData[cache.eventName].set(
              val.groupCols,
              parseFloat(totalNum.toFixed(round))
            )
          }
        })
      }
    })

    const keySet = new Set()
    for (const k in tempData) {
      const temArr = [...tempData[k].keys()]
      for (const val of temArr) {
        keySet.add(val)
      }
    }
    const series = []
    const legendData = []
    for (const item of keySet) {
      const name = typeof item === 'string' ? item.replace(/~/g, ',') : item
      legendData.push(name)
      const obj = {
        name: name,
        type: 'bar',
        barMaxWidth: '40px',
        data: [],
        emphasis: {
          focus: 'series',
        },
        label: {
          show: state.showChartLabel,
          position: 'top',
        },
      }
      for (const key in tempData) {
        if (tempData[key].get(item)) {
          obj['tooltip'] = {
            formatter: (params) => {
              const name = params.name
              return toolTipFormatter(params, roundMap[name]['round'])
            },
          }
          obj.data.push({
            value: tempData[key].get(item),
            round: roundMap[key]['round'],
          })
        } else {
          obj['tooltip'] = {
            formatter: (params) => {
              return toolTipFormatter(params)
            },
          }
          obj.data.push(0)
        }
      }
      series.push(obj)
    }

    state.options.xAxis.data = xAxisData
    state.options.series = [...series]
    state.options.legend.data = [...legendData]
    setCustomChartDataZoom(xAxisData)
  }

  //饼状图
  const setPieChart = () => {
    const eventCheckList = state.eventCheckList
    const groupCheckList = state.groupOptions.groupCheckList
    const data = cloneDeep(dataCache.value)
    const tempData = {}
    const roundData = {}

    // 按事件分组
    data?.y?.forEach((cache) => {
      if (eventCheckList.includes(cache.eventName)) {
        const round =
          roundObj[cache.round] === undefined ? 2 : roundObj[cache.round]
        tempData[cache.eventName] = {}
        roundData[cache.eventName] = round
        cache.item.forEach((val) => {
          if (
            isIncludesGroupCols(groupCheckList, data.unionGroups, val.groupCols)
          ) {
            const totalNum = val.values.reduce((acc, cur) => {
              return acc + cur
            }, 0)
            tempData[cache.eventName][val.groupCols] = parseFloat(
              totalNum.toFixed(round)
            )
          }
        })
      }
    })

    const keySet = new Set()
    for (const k in tempData) {
      const temArr = Object.keys(tempData[k]).sort(
        (a, b) => tempData[k][b] - tempData[k][a]
      )
      const sortdata = temArr
      for (const val of sortdata) {
        keySet.add(val)
      }
    }
    let optionsList = []
    for (const key in tempData) {
      const option = initPieOptions(key)

      for (const item of keySet) {
        if (tempData[key][item]) {
          if (option.series[0].data.length > 10) {
            const len = option.series[0].data.length
            const optionItem = option.series[0].data[len - 1]
            let total = optionItem.value
            total += tempData[key][item]
            option.series[0].data[len - 1].value = parseFloat(
              total.toFixed(roundData[key])
            )
            option.series[0].data[len - 1].name = t('analysis.other')
          } else {
            option.series[0].data.push({
              value: tempData[key][item],
              name:
                typeof item === 'string' ? item.replace(/~|,/g, '\n') : item,
            })
          }
        }
      }
      optionsList.push(option)
    }

    optionsList = optionsList.map((item) => {
      const invisible = item.series.some((sub) => sub.data.length)
      return {
        ...item,
        graphic: {
          type: 'text',
          left: 'center',
          top: '50%',
          invisible,
          style: {
            text: t('common.noData'),
            textAlign: 'center',
            fill: '#333',
            fontSize: 14,
          },
        },
      }
    })
    state.pieOptionData = optionsList
  }

  //柱状图堆叠图
  const setStackBarChart = () => {
    const eventCheckList = state.eventCheckList
    const groupCheckList = state.groupOptions.groupCheckList
    const data = cloneDeep(dataChartCache.value)
    let series = []
    const legendData = []

    data?.y?.forEach((item) => {
      if (eventCheckList.includes(item.eventName)) {
        item.item.forEach((childItem, i) => {
          if (
            isIncludesGroupCols(
              groupCheckList,
              data.unionGroups,
              childItem.groupCols
            )
          ) {
            const name =
              item.eventName +
              (childItem.groupCols ? '.' + childItem.groupCols : '')
            const chartName =
              typeof name === 'string' ? name.replace(/~/g, ',') : `${name}`
            series.push({
              type: 'bar',
              barMaxWidth: '40px',
              name: chartName,
              stack: item.eventName,
              data: childItem.values.map((el) => ({
                value: el,
                round: item.round,
              })),
              emphasis: {
                focus: 'series',
              },
              tooltip: {
                formatter: (params) => {
                  return toolTipFormatter(params, item.round)
                },
              },
              label: {
                show: state.showChartLabel,
                position: 'top',
              },
            })
            legendData.push(chartName)
          }
        })
      }
    })

    const dateXData = Array.isArray(data.x) ? [...data.x] : []
    if (state.particleType.particle === 'day') {
      series = setWeekEndMark(dateXData, series)
    }
    state.options.xAxis.data = dateXData
    state.options.series = [...series]
    state.options.legend.data = [...legendData]
    setCustomChartDataZoom(dateXData)
  }

  // echart 对比展示 趋势图和累计图
  const trendAndCumulative = () => {
    const eventCheckList = state.eventCheckList
    const groupCheckList = state.groupOptions.groupCheckList
    const versusBool = state.selectedStageChartIndex.length > 1
    // graphType 图表类型：1 趋势图，2累计图
    const graphTypeBool = state.graphType === 1
    const series = []
    const xAxisData = fillData(
      dataChartCache.value.x_compared_list.filter((item, index) =>
        state.selectedStageChartIndex.includes(index)
      )
    )
    dataChartCache.value.y.forEach((item) => {
      if (eventCheckList.includes(item.eventName)) {
        item.item.forEach((childItem, i) => {
          if (
            isIncludesGroupCols(
              groupCheckList,
              dataChartCache.value.unionGroups,
              childItem.groupCols
            )
          ) {
            const name =
              item.eventName +
              (childItem.groupCols ? '.' + childItem.groupCols : '')
            const chartName =
              typeof name === 'string' ? name.replace(/~/g, ',') : `${name}`
            // 根据已选阶段渲染
            const seriesData = childItem.values_compared_list.filter(
              (item, index) => state.selectedStageChartIndex.includes(index)
            )
            seriesData.forEach((compared, index) => {
              const data = graphTypeBool
                ? compared.map((subCompared) => ({
                    value: subCompared.comparedValue,
                    dateIndex: index,
                    round: item.round,
                  }))
                : compared.reduce((accumulatedData, subCompared) => {
                    accumulatedData.push({
                      value: strip(
                        subCompared.comparedValue +
                          (accumulatedData.length > 0
                            ? accumulatedData[accumulatedData.length - 1].value
                            : 0)
                      ),
                      dateIndex: index,
                      round: item.round,
                    })
                    return accumulatedData
                  }, [])
              series.push({
                type: 'line',
                data,
                name: chartName,
                emphasis: {
                  focus: 'series',
                },
                lineStyle: {
                  type: lineType[index],
                  width: 1,
                },
                label: {
                  show: state.showChartLabel,
                  position: 'top',
                },
              })
            })
          }
        })
      }
    })
    if (
      dataChartCache.value.x_compared_list[0] &&
      state.particleType.particle === 'day'
    ) {
      setWeekEndMark(
        dataChartCache.value.x_compared_list[0].map(
          (item) => item.comparedDate
        ),
        series,
        xAxisData
      )
    }

    state.options = Object.freeze({
      ...initOptions(),
      legend: {
        itemHeight: 6,
        itemWidth: 16,
        bottom: '4%',
        type: 'scroll',
        icon: 'rect', // 设置图例项的形状为长方形
      },
      yAxis: [
        {
          type: 'value',
          axisLine: {
            show: false,
          },
        },
      ],
      tooltip: {
        trigger: 'item',
        extraCssText: customExtraCssText,
        enterable: true, // 鼠标可进入提示框浮层中
        confine: true, // 将 tooltip 框限制在图表的区域内
        axisPointer: {
          type: 'shadow',
        },
        formatter(params) {
          return trendAndCumulativeFormatter(params, versusBool)
        },
      },
      ...(xAxisData.length > 7
        ? {
            dataZoom: {
              ...dataZoomOption,
            },
          }
        : {}),
      xAxis: [
        {
          show: true,
          data: xAxisData,
          type: 'category',
          axisTick: { show: false, alignWithLabel: true },
          axisPointer: {
            // 单个展示增加配置
            show: true,
            type: 'line',
            label: {
              show: false,
            },
          },
        },
      ],
      series,
      animation: !state.showChartLabel,
    })
  }

  // 对比ecahrt图表分布图
  const distributed = () => {
    const eventCheckList = state.eventCheckList
    const groupCheckList = state.groupOptions.groupCheckList
    let series = []
    const xAxisData = []
    // 过滤掉未选阶段
    const selectedStage = [state.dateRange, ...state.versus].filter(
      (item, index) => state.selectedStageChartIndex.includes(index)
    )
    // 记录dataChartCache.value.y里每个指标同一阶段一行累加的值
    const stageValue = {}
    dataChartCache.value.y.forEach((sub) => {
      if (eventCheckList.includes(sub.eventName)) {
        // 没分组
        if (!dataChartCache.value.groupColumn) {
          xAxisData.push(sub.eventName)

          series = selectedStage.map((stage, index) => {
            sub.item.forEach((v) => {
              // 根据已选阶段渲染
              const seriesData = v.values_compared_list.filter(
                (compared, index) =>
                  state.selectedStageChartIndex.includes(index)
              )
              ;(stageValue[index] || (stageValue[index] = [])).push({
                value: strip(
                  seriesData[index].reduce(
                    (acc, cur) => (acc += cur.comparedValue),
                    0
                  )
                ),
                round: sub.round,
              })
            })
            return {
              data: stageValue[index],
              name: stage.mainName,
            }
          })
        } else {
          // 有分组
          sub.item.forEach((subItem, subIndex) => {
            // 当前已选分组
            if (
              isIncludesGroupCols(
                groupCheckList,
                dataChartCache.value.unionGroups,
                subItem.groupCols
              )
            ) {
              const name =
                sub.eventName +
                (subItem.groupCols ? '.' + subItem.groupCols : '')
              const chartName =
                typeof name === 'string' ? name.replace(/~/g, ',') : `${name}`

              xAxisData.push(chartName)

              // 根据已选阶段渲染
              const seriesData = subItem.values_compared_list.filter(
                (compared, index) =>
                  state.selectedStageChartIndex.includes(index)
              )
              seriesData.forEach((seriesItem, index) => {
                ;(stageValue[index] || (stageValue[index] = [])).push({
                  value: strip(
                    seriesItem.reduce(
                      (acc, cur) => (acc += cur.comparedValue),
                      0
                    )
                  ),
                  round: sub.round,
                })
              })
              series = selectedStage.map((stage, stageIndex) => {
                return {
                  data: stageValue[stageIndex],
                  name: stage.mainName,
                }
              })
            }
          })
        }
      }
    })

    // 相同name时，改变颜色其中一个颜色
    const nameCounts = new Map()
    series = series.map((item) => {
      const name = item.name
      const count = nameCounts.get(name) || 0
      nameCounts.set(name, count + 1)

      return {
        ...item,
        name: item.name || '原始日期',
        type: 'bar',
        barMaxWidth: 30,
        emphasis: {
          focus: 'series',
        },
        ...(count > 0 && {
          itemStyle: {
            color: generateRandomColor(),
          },
        }),
        label: {
          show: state.showChartLabel,
          position: 'top',
        },
      }
    })

    state.options = Object.freeze({
      ...initOptions(),
      legend: {
        // data: ['配置用户占比', '模拟用户占比'],
        itemHeight: 6,
        itemWidth: 16,
        bottom: '3%',
        type: 'scroll',
      },
      yAxis: [
        {
          type: 'value',
          axisLine: {
            show: false,
          },
        },
      ],
      tooltip: {
        trigger: 'item',
        extraCssText: customExtraCssText,
        enterable: true, // 鼠标可进入提示框浮层中
        confine: true, // 将 tooltip 框限制在图表的区域内
        axisPointer: {
          type: 'shadow',
        },
        formatter(params) {
          return distributedFormatter(params)
        },
      },

      ...(xAxisData.length > 7
        ? {
            dataZoom: {
              ...dataZoomOption,
            },
          }
        : {}),
      xAxis: [
        {
          show: true,
          data: xAxisData,
          type: 'category',
          axisTick: { show: false, alignWithLabel: true },
          axisPointer: {
            // 单个展示增加配置
            show: true,
            type: 'shadow',
            label: {
              show: false,
            },
          },
        },
      ],
      series,
      animation: !state.showChartLabel,
    })
  }

  return {
    groupComparator,
    setLineOrAreaChart,
    setTotalBarChart,
    setBarChart,
    setPieChart,
    setStackBarChart,
    trendAndCumulative,
    distributed,
  }
}
