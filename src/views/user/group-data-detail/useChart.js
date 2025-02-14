import { computed, markRaw, reactive, shallowRef, toRefs } from 'vue'
import { setWeekEndMark } from '@/components/Chart/utils.js'
import { chartColor } from '@/enumeration/chart.js'
import { asyncGetGroupDistributionOfPeople } from '@/api/modules/user-group.js'

// params = reactive 定义的数据
export default function (params) {
  const state = reactive({
    chartLoading: false,
    chartType: 'line',
    chartData: {
      aAxisDataList: [],
      tagStatsList: [],
      yAxisDataList: [],
    },
  })
  const options = shallowRef({
    tooltip: {
      trigger: 'axis',
      enterable: true, //鼠标可进入提示框浮层中
      confine: true, //将 tooltip 框限制在图表的区域内
      axisPointer: {
        type: 'shadow',
      },
      formatter(params) {
        let html = ''
        params.forEach((v) => {
          html += ` <div>
                  <span class="fz14 txt-bold c86919d">${v.name}：</span><span class="c545e6e">${v.value}</span>
          </div>`
        })
        return html
      },
    },
    /* legend: {
      itemHeight: 10,
      itemWidth: 10,
      // orient: 'vertical',
      icon: 'circle',
      // left: 'left',
      // 解决circle文字不对齐问题
    },*/
    grid: {
      // left: '8%',
      top: '7%',
      right: '4',
      // height: '65%',
      width: '92%',
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
      bottom: 5,
      left: '3%',
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
  const errorList = computed(() => {
    return state.chartData.aAxisDataList.filter((item) => item.extraInfo)
  })
  // ID分群、结果分群无 自动更新才有
  const showChart = computed(() => {
    // 暂时不做自动更新显示的限制 refreshType === 1
    /* return (
      ![2, 3].includes(params.createType) &&
      params.basicInfoData.refreshType === 1
    )*/
    // ID和结果分群 不展示
    return ![2, 3].includes(params.createType)
  })
  const chartsOption = computed(() => {
    const series = [
      {
        // name: '总量',
        type: state.chartType,
        barGap: 0,
        label: {
          show: false,
        },
        emphasis: {
          focus: 'series',
        },
        // 设置柱子最大宽度为 30
        barMaxWidth: 30,
        itemStyle: {
          color: chartColor[0],
        },
        data: state.chartData.yAxisDataList.map((item) => item.count),
      },
    ]
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

  const getChartData = async () => {
    if (!showChart.value) return
    state.chartLoading = true
    const { data } = await asyncGetGroupDistributionOfPeople({
      id: params.id,
      startDate: params.date.date[0],
      endDate: params.date.date[1],
    }).finally((_) => {
      state.chartLoading = false
    })
    state.chartData = markRaw(data)
  }

  return {
    ...toRefs(state),
    showChart,
    errorList,
    chartsOption,
    getChartData,
  }
}
