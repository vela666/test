import { t } from '@/locales/i18n'
export { default as ChartType } from './ChartType.vue'
export { default as AnalysisTable } from './AnalysisTable.vue'
export { default as AnalysisMain } from './index.vue'

// graphType 图表类型：
// 1 趋势图，2累计图，3分布图，4堆积图，5饼状图，6数据表 ，7柱状图，8留存图, 9 漏斗图
export const chartTypeMap = new Map([
  [
    'line',
    [
      {
        value: 'line',
        title: t('chart.trend'),
        icon: 'chart-trend',
        graphType: 1,
      },
    ],
  ],
  [
    'accumulation',
    [
      {
        value: 'accumulation',
        title: t('chart.cumulative'),
        icon: 'chart-accumulation',
        graphType: 2,
      },
    ],
  ],
  [
    'distribution',
    [
      {
        value: 'distribution',
        title: t('chart.scatter'),
        icon: 'chart-distribution',
        graphType: 3,
      },
    ],
  ],
  [
    'heapup',
    [
      {
        value: 'heapup',
        title: t('chart.lineStack'),
        icon: 'chart-heapup',
        graphType: 4,
      },
    ],
  ],
  [
    'pie',
    [{ value: 'pie', title: t('chart.pie'), icon: 'chart-pie', graphType: 5 }],
  ],
  [
    'table',
    [
      {
        value: 'table',
        title: t('chart.dataTable'),
        icon: 'chart-table',
        graphType: 6,
      },
    ],
  ],
  [
    'bar',
    [
      {
        value: 'bar',
        title: t('chart.bar'),
        icon: 'chart-transform',
        graphType: 7,
      },
    ],
  ],
  [
    'retention',
    [
      {
        value: 'retention',
        title: t('chart.retention'),
        icon: 'chart-retention',
        graphType: 8,
      },
    ],
  ],
  [
    'funnel',
    [
      {
        value: 'funnel',
        title: t('chart.funnel'),
        icon: 'chart-funnel',
        graphType: 9,
      },
    ],
  ],
  [
    'barstack',
    [{ value: 'barstack', title: t('chart.barStack'), icon: 'chart-stackbar' }],
  ],
  [
    'default',
    [
      {
        value: 'line',
        title: t('chart.trend'),
        icon: 'chart-trend',
        graphType: 1,
      },
      {
        value: 'accumulation',
        title: t('chart.cumulative'),
        icon: 'chart-accumulation',
        graphType: 2,
      },
      {
        value: 'distribution',
        title: t('chart.scatter'),
        icon: 'chart-distribution',
        graphType: 3,
      },
      {
        value: 'heapup',
        title: t('chart.lineStack'),
        icon: 'chart-heapup',
        graphType: 4,
      },
      { value: 'pie', title: t('chart.pie'), icon: 'chart-pie', graphType: 5 },

      {
        value: 'table',
        title: t('chart.dataTable'),
        icon: 'chart-table',
        graphType: 6,
      },
      {
        value: 'bar',
        title: t('chart.bar'),
        icon: 'chart-transform',
        graphType: 7,
      },
      {
        value: 'retention',
        title: t('chart.retention'),
        icon: 'chart-retention',
        graphType: 8,
      },
      {
        value: 'funnel',
        title: t('chart.funnel'),
        icon: 'chart-funnel',
        graphType: 9,
      },
      { value: 'barstack', title: t('chart.barStack'), icon: 'chart-stackbar' },
    ],
  ],
])

// 1 趋势图，2累计图，3分布图，4堆积图，5饼状图，6数据表 ，7柱状图，8留存图, 9 漏斗图
export const graphTypeMap = new Map([
  [1, 'line'],
  [2, 'accumulation'],
  [3, 'distribution'],
  [4, 'heapup'],
  [5, 'pie'],
  [6, 'table'],
  [7, 'bar'],
  [8, 'retention'],
  [9, 'funnel'],
])
