import { chartColor } from '@/enumeration/chart'

export const barChartOptions = () => ({
  color: chartColor,
  tooltip: {
    trigger: 'axis',
    extraCssText: 'z-index: 99;max-height: 300px;overflow-y:auto',
    confine: true,
    enterable: true,
  },
  legend: {
    bottom: 5,
    padding: 10,
    type: 'scroll',
    show: true,
    selected: null,
  },
  grid: {
    top: '10%',
    left: '3%',
    right: '3%',
    bottom: '10%',
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
  },
  series: [],
})

export const pieChartOptions = () => ({
  color: chartColor,
  title: {
    text: '',
    left: 'center',
  },
  tooltip: {
    trigger: 'item',
    formatter: '{b} : {c} ({d}%)',
  },
  series: [
    {
      type: 'pie',
      radius: [50, 100],
      label: {
        show: true,
        formatter: '{b} : {c} ({d}%)',
      },
      data: [],
      emphasis: {
        focus: 'self',
      },
    },
  ],
})
