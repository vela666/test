import { toRefs, reactive, markRaw, computed, shallowRef } from 'vue'
import { asyncGetTagDistributionOfPeople } from '@/api/modules/user-tag.js'
import { setWeekEndMark } from '@/components/Chart/utils.js'
import { groupBy } from 'lodash-es'

// params = reactive 定义的数据
export default function (params) {
  const state = reactive({
    chartLoading: false,
    chartType: 'bar',
    chartData: {
      aAxisDataList: [],
      tagStatsList: [],
      yAxisDataList: [],
    },
    chartRef: null,
  })
  const options = shallowRef({
    tooltip: {
      trigger: 'axis',
      extraCssText: 'z-index: 99;max-height: 300px;overflow-y:auto',
      enterable: true, //鼠标可进入提示框浮层中
      confine: true, //将 tooltip 框限制在图表的区域内
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        let html = ''
        if (Array.isArray(params)) {
          let keys = groupBy(params, 'name')
          // 数组是多个查看，对象是单个查看
          Object.keys(keys).forEach((k, index) => {
            let v = keys[k]
            html += `<div class="f-size-14 f-weight-700 c-616161">${k}(${state.chartData.yAxisDataList[v[0].dataIndex].count})</div>`
            v.forEach((item) => {
              if (item.value !== '-') {
                html += `
               <div class="flex-center">
             <span class="mr5 nd-chart-tooltip-shape" style="background-color:${item.color}"></span>
              <span> ${item.seriesName}：</span>
              <span>${item.value}</span>
             </div>`
              }
            })
          })
        } else {
          // trigger: 'axis' 注释了才会执行这里
          if (params.componentType === 'markPoint') {
            html = `
              <div class="f-size-14 f-weight-700 c-616161">${state.chartData.aAxisDataList[params.seriesIndex].extraInfo}</div>
              `
          } else {
            html = `
              <div class="f-size-14 f-weight-700 c-616161">${params.name}</div>
                <div class="flex-center">
             <span class="mr5 nd-chart-tooltip-shape" style="background-color:${params.color}"></span>
                     <span>${params.seriesName}：</span>
                     <span>${params.value}</span>
                </div>
              `
          }
        }
        return html
      },
    },
    /* legend: {
          itemHeight: 10,
          itemWidth: 10,
          // orient: 'vertical',
          icon: 'circle',
          bottom: '8%',
          type: 'scroll',
          // left: 'left',
          // 解决circle文字不对齐问题
        },*/
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
      bottom: 4,
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
  })

  const transformTagStats = (data) => {
    const tagMap = {}

    for (let listIdx = 0; listIdx < data.length; listIdx++) {
      for (const { tagValue, usersNum } of data[listIdx]) {
        // 初始化一个长度与tagStatsList相同的数组
        if (!tagMap[tagValue]) {
          // console.log()
          tagMap[tagValue] = Array.from({ length: data.length }, () => '-')
        }
        // 直接填充对应下标usersNum值
        tagMap[tagValue][listIdx] = usersNum
      }
    }
    // 找到最小的值
    /* const minValue = data
      .flat() // Flatten the array of arrays into a single array
      .map((item) => item.usersNum) // Extract the usersNum values into a new array
      .reduce((min, usersNum) => Math.min(min, usersNum), 0) // Find the minimum usersNum value*/

    return Object.keys(tagMap).map((tagValue, index) => {
      return {
        name: tagValue,
        type: state.chartType,
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
        data: tagMap[tagValue],
      }
    })
  }

  const chartsOption = computed(() => {
    const series = transformTagStats(state.chartData.tagStatsList)
    const aAxisDataList = state.chartData.aAxisDataList.map(
      (item) => item.dayStr
    )
    return {
      ...options.value,
      xAxis: {
        ...options.value.xAxis,
        data: aAxisDataList,
      },
      series: setWeekEndMark(aAxisDataList, series),
    }
  })

  const errorList = computed(() => {
    return state.chartData.aAxisDataList.filter((item) => item.extraInfo)
  })

  const getChartData = async () => {
    state.chartLoading = true
    const { data } = await asyncGetTagDistributionOfPeople({
      id: params.id,
      startDate: params.date.date[0],
      endDate: params.date.date[1],
    }).finally((_) => {
      state.chartLoading = false
    })
    state.chartData = markRaw(data)
    /*state.chartData = markRaw({
      aAxisDataList: [
        {
          dayStr: '2024-03-01',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-02',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-03',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-04',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-05',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-06',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-07',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-08',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-09',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-10',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-11',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-12',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-13',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-14',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-15',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-16',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-17',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-18',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-19',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-20',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-21',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-22',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-23',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-24',
          extraInfo: '',
        },
        {
          dayStr: '2024-03-25',
          extraInfo: '',
        },
      ],
      tagStatsList: [
        [
          /!*{
                        "tagValue": "标签值3",
                        "usersNum": 110
                    },*!/
          {
            tagValue: '标签值1',
            usersNum: 100,
          },
          {
            tagValue: '标签值2',
            usersNum: 11000,
          },
          {
            tagValue: '标签值4',
            usersNum: 300,
          },
          {
            tagValue: '标签值5',
            usersNum: 10,
          },
        ],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
      ],
      yAxisDataList: [
        {
          count: 50000,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
        {
          count: 0,
        },
      ],
    })*/
  }
  return {
    ...toRefs(state),
    errorList,
    chartsOption,
    getChartData,
  }
}
