import { cloneDeep, groupBy } from 'lodash-es'
import { thousandsFilter } from './index.js'

const dataZoom = {
  realtime: false,
  type: 'slider',
  show: true,
  xAxisIndex: [0],
  // realtime: false,
  filterMode: 'filter',
  // zoomLock: true,
  brushSelect: false,
  // throttle: 300,
  bottom: 10,
  start: 0,
  end: 100,
  // left: '10%',
  // right: '10%',
  // width: '90%',
  // rangeMode: ['value', 'value'],
  // handleSize: 0,
  showDetail: false,
  showDataShadow: false,
  height: '4%',
}

export default {
  showChartLabel: false,
  // sql查询用的
  // 1: 原值 2:百分比展示
  valueDisplaySelect: 1, //Y轴展示方式
  valueDisplaySelectr: 1, //次Y轴展示方式
  dataZoomStart: 0,
  dataZoomEnd: 0,
  recordDataZoomStartEndPos(instance, type) {
    instance.off('datazoom')
    // 监听'滚动条'的 datazoom 事件 使得graphic上的值随着滚动改变
    instance.on('datazoom', () => {
      const { start, end } = instance.getOption().dataZoom[0]
      this.dataZoomStart = start
      this.dataZoomEnd = end
    })
    if (!type) {
      this.dataZoomStart = 0
      this.dataZoomEnd = 100
    }
    dataZoom.start = this.dataZoomStart
    dataZoom.end = this.dataZoomEnd
  },
  sqlValPercentage(val, decimal = 2, index) {
    if (index === 1) {
      val =
        this.valueDisplaySelectr === 2
          ? `${(val * 100).toFixed(decimal)}%`
          : val
    } else {
      val =
        this.valueDisplaySelect === 2 ? `${(val * 100).toFixed(decimal)}%` : val
    }
    return thousandsFilter(val)
  },
  // analysis = 'event' 事件分析等
  newChartOptions(options, animation, analysis = '') {
    let tmp = cloneDeep(options)
    if (analysis === 'sql') {
      tmp.tooltip.formatter = (params) => {
        let html = ''
        // 数组是多个查看，对象是单个查看
        if (Array.isArray(params)) {
          let keys = groupBy(params, 'name')
          Object.keys(keys).forEach((k) => {
            let v = keys[k]
            html += `<div class="c-616161 f-size-12">${k}</div>`
            v.forEach((item, index) => {
              html += `
             <div class="flex-center f-size-12">
           <span class="mr5" style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${
             item.color
           }"></span>
            <span>
             ${item.seriesName}：
             </span>
             <span>${this.sqlValPercentage(
               item.value,
               null,
               tmp.series[index].yAxisIndex
             )}</span>
           </div>`
            })
          })
        } else {
          // 次Y轴下标开始位置
          const index = tmp.series.findIndex((i) => i.yAxisIndex === 1)
          html = `
            <div class="c-616161 f-size-12">${params.seriesName}</div>
              <div class="flex-center f-size-12">
                   <span class="mr5" style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${
                     params.color
                   }"></span>
                   <span>${params.name}：</span>
                   <span>${this.sqlValPercentage(
                     params.value,
                     null,
                     index <= params.componentIndex ? 1 : 0
                   )}</span>
              </div>
            `
        }
        return html
      }
      tmp.yAxis = tmp.yAxis.map((yAxis, index) => {
        return {
          ...yAxis,
          axisLabel: {
            formatter: (params, ...rest) => {
              return this.sqlValPercentage(params, 0, index)
            },
          },
        }
      })
      if (tmp.xAxis.data.length > 7) {
        tmp.dataZoom = {
          ...dataZoom,
          // end: (7 / tmp.xAxis.data.length) * 100
        }
      }
    }
    return {
      ...tmp,
      animation,
      series: tmp.series.map((item, index) => {
        return {
          ...item,
          label: {
            show: !!this.showChartLabel,
            position: 'top',
            formatter: ({ value, data, componentIndex }) => {
              let bool = false
              switch (analysis) {
                case 'event':
                  bool = data.round === 2
                  break
                /* case 'ltv':
                                  bool = data.percentage
                                  break*/
                default:
                  bool = data.percentage
              }
              // thousandsFilter = 千分位
              return bool
                ? `${value}%`
                : analysis === 'sql'
                  ? this.sqlValPercentage(
                      value,
                      null,
                      tmp.series[index].yAxisIndex
                    )
                  : thousandsFilter(value)
            },
          },
        }
      }),
    }
  },
}
