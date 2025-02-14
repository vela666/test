import { thousandsFilter } from '@/utils'
import { t } from '@/locales/i18n'

export const chartOptions = () => ({
  title: {
    text: '',
    show: false,
  },
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    extraCssText: 'z-index: 99',
  },
  series: {
    type: 'sankey',
    label: {
      position: 'inside',
      formatter: (params) => {
        return `${params.data.showName}\n${thousandsFilter(params.data.times)}`
      },
      color: '#333',
      width: 150,
      overflow: 'truncate',
    },
    width: '100%',
    layoutIterations: 0,
    tooltip: {
      formatter: (params) => {
        let tips = ''
        if (params.dataType === 'node') {
          tips = `${params.data.showName}：<br />
          <span style="color:#5473E8">（${thousandsFilter(
            params.data.times
          )} ${t('analysis.path.sessions')}）</span>
          <br/>
          ${thousandsFilter(params.data.retention)} ${t('analysis.path.retentionCount')}（${
            params.data.retentionRate
          }） <br/>
          ${thousandsFilter(params.data.wastage)} 
          ${params.data.sourceType === '0' ? t('analysis.path.lossCount') : t('analysis.path.startingCount')}
          （${params.data.wastageRate}）`
        } else if (params.dataType === 'edge') {
          tips = `${t('analysis.path.totalFrom', [params.data.sourceName, params.data.targetName, params.data.rate])}
          <br /><span style="color:#5473E8">（${thousandsFilter(
            params.data.value
          )}${t('analysis.path.sessions')}）</span>`
        }
        return tips
      },
      extraCssText: 'z-index: 99',
    },
    itemStyle: {
      color: '#5473E8',
    },
    left: 0,
    draggable: false,
    nodeWidth: 150,
    nodeGap: 30,
    nodeAlign: 'justify',
    data: [],
    links: [],
  },
})
