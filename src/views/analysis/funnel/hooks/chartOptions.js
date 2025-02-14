import { chartColor } from '@/enumeration/chart'

export const barChartOptions = () => ({
  color: chartColor,
  tooltip: {
    trigger: 'item',
    extraCssText: 'z-index: 99',
    confine: true,
  },
  toolbox: {
    show: true,
    right: '2%',
    top: '4%',
    feature: {},
  },
  legend: {
    bottom: '10%',
    type: 'scroll',
    show: true,
    data: [],
  },
  grid: {
    top: '10%',
    left: '3%',
    right: '3%',
    bottom: '20%',
    containLabel: true,
  },
  xAxis: {
    axisTick: {
      show: false,
    },
    axisLine: {
      lineStyle: {
        color: '#ccc',
      },
    },
    axisLabel: {
      color: '#000',
    },
    type: 'category',
    data: [],
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    axisLabel: {
      show: true,
      width: 20,
      formatter: '{value}%',
    },
  },
  series: [],
})

export const funnelChartOptions = () => ({
  color: chartColor,
  tooltip: {
    trigger: 'item',
    formatter: null,
    extraCssText: 'z-index: 99',
    confine: true,
    enterable: true,
  },
  toolbox: {
    show: true,
    right: '2%',
    top: '4%',
    feature: {},
  },
  legend: {
    bottom: 10,
    type: 'scroll',
    show: true,
  },
  grid: {
    top: '10%',
    left: '3%',
    right: '3%',
    bottom: '10%',
    containLabel: true,
  },
  series: [],
})
