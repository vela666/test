import { chartColor } from '@/enumeration/chart'
import { intervalUtils } from '@/views/analysis/interval/hooks'
import { t } from '@/locales/i18n'

export const boxplotChartOptions = () => ({
  color: chartColor,
  tooltip: {
    trigger: 'item',
    extraCssText: 'z-index: 99',
    confine: true,
    formatter: (params) => {
      return `
        <div>${params.data.groupName || ''}</div>
		<div>${params.name}</div>
		<div>
			<div>
				<span>${params.marker}</span>
				<span>${t('analysis.interval.minimumValue')}：${params.data._minNum}</span>
			</div>
			<div>
				<span>${params.marker}</span>
				<span>${t('analysis.interval.lowerQuartile')}：${params.data._downFourNum}</span>
			</div>
			<div>
				<span>${params.marker}</span>
				<span>${t('analysis.interval.median')}：${params.data._midNum}</span>
			</div>
			<div>
				<span>${params.marker}</span>
				<span>${t('analysis.interval.upperQuartile')}：${params.data._upFourNum}</span>
			</div>
			<div>
				<span>${params.marker}</span>
				<span>${t('analysis.interval.maximumValue')}：${params.data._maxNum}</span>
			</div>
		</div>
      `
    },
  },
  legend: {
    bottom: 50,
    type: 'scroll',
    data: [],
  },
  grid: {
    top: 20,
    left: 20,
    right: 20,
    bottom: 50,
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
    axisLabel: {
      show: true,
      formatter: (value) => intervalUtils.getDuration(value),
    },
  },
  dataZoom: [
    {
      type: 'inside',
      start: 0,
      end: 40,
    },
    {
      show: true,
      type: 'slider',
      xAxisIndex: [0],
      start: 0,
      end: 40,
      height: 20,
      bottom: 20,
    },
  ],
  series: [],
})

export const barChartOptions = () => ({
  color: chartColor,
  tooltip: {
    trigger: 'axis',
    extraCssText: 'z-index: 99;max-height: 300px;overflow-y:auto',
    confine: true,
    enterable: true,
    formatter: (params) => {
      return `
					<span>
						<span>${params[0].marker}</span>
						<span>${params[0].name}${t('dateRangeSelect.second')}</span>
						<strong style="font-weight: 700; font-size: 16px">${params[0].data?._value}</strong>
					</div>
				`
    },
  },
  legend: {
    bottom: 10,
    padding: 10,
    type: 'scroll',
    show: false,
    selected: null,
  },
  grid: {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
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
      formatter: (value) => `${value}${t('dateRangeSelect.second')}`,
    },
    type: 'category',
    data: [],
  },
  yAxis: {
    type: 'value',
  },
  series: [],
})
