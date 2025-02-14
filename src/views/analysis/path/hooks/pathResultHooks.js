import { nextTick, reactive } from 'vue'
import { past7DayRange } from '@/enumeration/date'
import { cloneDeep } from 'lodash-es'
import { chartOptions } from './chartOptions'
import { t } from '@/locales/i18n'

export function usePathResultHooks(emit) {
  const analysisResult = reactive({
    dateRange: past7DayRange,
    status: -1,
    resultGenerateTime: '',
    dataSource: {},
    option: chartOptions(),
    dataQP: '',
    chartWidth: '',
  })

  const nodeList = reactive({
    clickedNodeList: [],
    selectedNodeList: [],
    visible: false,
    clickedNode: {},
    detailDialog: false,
  })

  /**
   * @description: 图表数据
   * @return {*}
   */
  const getEchartsData = (data, qp) => {
    const { resultGenerateTime, analysis } = data
    analysisResult.resultGenerateTime = resultGenerateTime

    const status =
      !analysis ||
      !analysis.links ||
      !analysis.nodes ||
      analysis.links.length === 0 ||
      analysis.nodes.length === 0
        ? 0
        : 1
    analysisResult.status = status
    analysisResult.dataSource = cloneDeep(analysis)
    analysisResult.dataQP = qp
    analysisResult.resultClusterSql = data.resultClusterSql

    if (status) renderChart()
  }

  /**
   * @description: 渲染图表
   * @return {*}
   */
  const renderChart = () => {
    analysisResult.option = chartOptions()

    const { nodes, links, eventNameDescMap } = analysisResult.dataSource

    nodes.forEach((item) => {
      item.sort((a, b) => b.times - a.times)
    })
    analysisResult.chartWidth = nodes.length * 150 + links.length * 80 + 'px'

    const sourceType = analysisResult.dataQP?.sourceEvent?.sourceType
    // 处理nodes数据
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes[i].length; j++) {
        const byVal = nodes[i][j].byValue ? `(${nodes[i][j].byValue})` : ''
        const showName =
          nodes[i][j].eventName === '更多'
            ? '更多'
            : eventNameDescMap[nodes[i][j].eventName]
        // 获取当前节点（node）的后续所有连接（links）
        const nodeNext = getNodeNext(nodes[i][j], i, nodes, links)
        analysisResult.option.series.data.push({
          name: nodes[i][j].id,
          showName: showName + byVal,
          showNameEn: nodes[i][j].byValue
            ? `${nodes[i][j].eventName}&${nodes[i][j].byValue}`
            : nodes[i][j].eventName,
          times: nodes[i][j].times,
          depth: i,
          sourceType,
          value: nodes[i][j].times,
          retention: nodeNext.retention, // 留存
          retentionRate: nodeNext.retentionRate, // 留存率
          wastage: nodeNext.wastage, // 流失
          wastageRate: nodeNext.wastageRate, // 流失率
        })
      }
    }
    // 处理links数据
    for (let i = 0; i < links.length; i++) {
      for (let j = 0; j < links[i].length; j++) {
        let sourceName = ''
        let targetName = ''
        if (typeof links[i][j].source === 'string') {
          let s = ''
          let bval = ''
          if (links[i][j].source.indexOf('!_!') > -1) {
            s = links[i][j].source.split('!_!')[1]
            const bval_temp = links[i][j].source.split('!_!')[0]
            if (bval_temp.split('#_#')[1]) {
              bval = `(${bval_temp.split('#_#')[1]})`
            }
          } else {
            s = links[i][j].source.split('#_#')[1]
          }
          if (s) {
            const eventName = s === '更多' ? '更多' : eventNameDescMap[s]
            sourceName = eventName + `${bval}`
          }
        }
        if (typeof links[i][j].target === 'string') {
          let t = ''
          let bval1 = ''
          if (links[i][j].target.indexOf('!_!') > -1) {
            t = links[i][j].target.split('!_!')[1]
            const bval_temp1 = links[i][j].target.split('!_!')[0]
            if (bval_temp1.split('#_#')[1]) {
              bval1 = `(${bval_temp1.split('#_#')[1]})`
            }
          } else {
            t = links[i][j].target.split('#_#')[1]
          }
          if (t) {
            const eName = t === '更多' ? '更多' : eventNameDescMap[t]
            targetName = eName + `${bval1}`
          }
        }
        // 获取当前连接线的上一个节点（source）
        const lastNode = getLinkLastNode(links[i][j], i, nodes)
        analysisResult.option.series.links.push({
          source: links[i][j].source,
          target: links[i][j].target,
          value: links[i][j].times,
          sourceName: sourceName,
          targetName: targetName,
          rate: lastNode.rate,
          lastNodeTotal: lastNode.lastNode,
        })
      }
    }
    const sourceEvent = analysisResult.dataQP.sourceEvent
    const sourceLabel =
      sourceEvent.sourceType === '0'
        ? t('analysis.path.startEvent')
        : t('analysis.path.endEvent')
    analysisResult.option.title.text = `${t('analysis.path.userBehaviorPath', [sourceEvent.eventDesc, sourceLabel])}`

    setTimeout(() => {
      const chart = analysisResult.chartRef.myChart

      chart?.on('click', (params) => {
        if (params.componentType === 'series') {
          if (params.seriesType === 'sankey') {
            if (params.dataType === 'node') {
              nodeList.visible = true
              // 点击到了 graph 的 node（节点）上。
              const left = params.event.event.clientX
              const top = params.event.event.clientY
              const msg = document.getElementById('msgbox')
              msg.style.setProperty('top', top + 'px')
              msg.style.setProperty('left', left + 'px')
              chart.dispatchAction({
                type: 'hideTip',
              })
              nodeList.clickedNode = params.data
            }
          }
        }
      })
    })
  }

  // 获取node的留存和流失
  const getNodeNext = (node, depth, nodeList, linkList) => {
    let retention = 0
    const id = node.id
    const sourceType = analysisResult.dataQP?.sourceEvent?.sourceType

    if (depth === nodeList.length - 1) {
      retention = node.times
    } else if (
      sourceType === '0' &&
      depth < nodeList.length - 1 &&
      linkList[depth]
    ) {
      const cur = linkList[depth]
      for (let i = 0; i < cur.length; i++) {
        if (
          cur[i].source &&
          cur[i].source === id &&
          cur[i].is_wastage === false
        ) {
          if (!isNaN(cur[i].times)) {
            retention += parseFloat(cur[i].times)
          }
        }
      }
    } else if (
      sourceType === '1' &&
      depth < nodeList.length &&
      linkList[depth - 1]
    ) {
      const cur = linkList[depth - 1]
      for (let i = 0; i < cur.length; i++) {
        if (
          cur[i].target &&
          cur[i].target === id &&
          cur[i].is_wastage === false
        ) {
          if (!isNaN(cur[i].times)) {
            retention += parseFloat(cur[i].times)
          }
        }
      }
    }
    const wastage = node.times - retention
    const retentionRate =
      node.times === 0
        ? '0%'
        : Math.round((retention / node.times) * 10000) / 100 + '%'
    const wastageRate =
      node.times === 0
        ? '0%'
        : Math.round((wastage / node.times) * 10000) / 100 + '%'

    return { retention, retentionRate, wastage, wastageRate }
  }

  // 获取link的源的总量
  const getLinkLastNode = (link, depth, nodeList) => {
    const source = link.source
    const cur = nodeList[depth]
    const times = link.times
    let total = 0
    for (let i = 0; i < cur.length; i++) {
      if (cur[i].id && cur[i].id === source) {
        if (!isNaN(cur[i].times)) {
          total = parseFloat(cur[i].times)
          break
        }
      }
    }
    const rate =
      total === 0 ? '0%' : Math.round((times / total) * 10000) / 100 + '%'
    return { total, rate }
  }

  /**
   * @description: 突出该节点的路径
   * @return {*}
   */
  const highLightNode = () => {
    if (!nodeList.clickedNodeList.includes(nodeList.clickedNode.name)) {
      nodeList.clickedNodeList.push(nodeList.clickedNode.name)
    }
    const links = JSON.parse(JSON.stringify(analysisResult.dataSource.links))
    const len = links.length
    if (!nodeList.selectedNodeList.includes(nodeList.clickedNode.name)) {
      nodeList.selectedNodeList.push(nodeList.clickedNode.name)
    }
    const selectedNodes = nodeList.selectedNodeList
    let prev = nodeList.clickedNode.depth - 1
    let next = nodeList.clickedNode.depth
    while (prev >= 0) {
      const tempArr = links[prev]
      for (let i = 0; i < tempArr.length; i++) {
        if (selectedNodes.includes(tempArr[i].target)) {
          if (!tempArr[i].source.includes('wastage')) {
            if (!selectedNodes.includes(tempArr[i].source)) {
              selectedNodes.push(tempArr[i].source)
            }
            selectedNodes.push(`${tempArr[i].source} > ${tempArr[i].target}`)
          }
        }
      }
      prev--
    }
    while (next <= len - 1) {
      const tempArr = links[next]
      for (let j = 0; j < tempArr.length; j++) {
        if (selectedNodes.includes(tempArr[j].source)) {
          if (!tempArr[j].target.includes('wastage')) {
            if (!selectedNodes.includes(tempArr[j].target)) {
              selectedNodes.push(tempArr[j].target)
            }
            selectedNodes.push(`${tempArr[j].source} > ${tempArr[j].target}`)
          }
        }
      }
      next++
    }
    nodeList.selectedNodeList = JSON.parse(JSON.stringify(selectedNodes))
    setHighLight(selectedNodes)
  }

  /**
   * @description: 设置与节点相关的路径高亮
   * @return {*}
   * @param {*} selectedNodes
   */
  const setHighLight = (selectedNodes) => {
    if (selectedNodes.length === 0) return
    const cloneOption = cloneDeep(analysisResult.option)
    const cloneNodes = cloneOption.series.data
    const cloneLinks = cloneOption.series.links

    for (let i = 0; i < cloneNodes.length; i++) {
      if (!selectedNodes.includes(cloneNodes[i].name)) {
        cloneNodes[i]['itemStyle'] = {
          opacity: 0.3,
        }
      } else {
        cloneNodes[i]['itemStyle'] = {
          opacity: 1,
        }
      }
    }
    for (let j = 0; j < cloneLinks.length; j++) {
      const linkName = `${cloneLinks[j].source} > ${cloneLinks[j].target}`
      if (!selectedNodes.includes(linkName)) {
        cloneLinks[j]['lineStyle'] = {
          opacity: 0.1,
        }
      } else {
        cloneLinks[j]['lineStyle'] = {
          opacity: 0.5,
        }
      }
    }

    analysisResult.chartRef.myChart.setOption(cloneOption)
  }

  /**
   * @description: 取消高亮
   * @return {*}
   */
  const cancelHighLight = () => {
    nodeList.clickedNodeList = []
    nodeList.selectedNodeList = []
    analysisResult.chartRef.myChart.setOption(analysisResult.option)
  }

  /**
   * @description: 保存草稿--回显时间
   * @return {*}
   */
  const echoGlobalFilters = ({ dateRange }) => {
    analysisResult.dateRange = {
      ...dateRange,
      shortcutType: dateRange.shortcutType ?? '',
    }
  }

  /**
   * @description: 重新开始分析
   * @return {*}
   */
  const reCalcute = () => {
    if (analysisResult.status !== -1) {
      nextTick(() => {
        emit('calcute')
      })
    }
  }

  /**
   * @description: 查看节点详细信息
   * @return {*}
   */
  const showNodeDetail = () => {
    getNodeDetail()
    nodeList.detailDialog = true
  }

  /**
   * @description: 查看节点详细信息
   * @return {*}
   */
  const getNodeDetail = () => {
    const nodes = JSON.parse(JSON.stringify(analysisResult.dataSource.nodes))
    const links = JSON.parse(JSON.stringify(analysisResult.dataSource.links))
    const eventNameDescMap = JSON.parse(
      JSON.stringify(analysisResult.dataSource.eventNameDescMap)
    )
    const depth = nodeList.clickedNode.depth
    const name = nodeList.clickedNode.name
    const total = nodeList.clickedNode.value

    let totalNext = 0
    const listData = []
    const sourceType = analysisResult.dataQP?.sourceEvent?.sourceType

    if (
      (sourceType === '0' && depth < nodes.length - 1 && links[depth]) ||
      (sourceType === '1' && depth < nodes.length && links[depth - 1])
    ) {
      const cur = sourceType === '1' ? links[depth - 1] : links[depth]

      for (let i = 0; i < cur.length; i++) {
        const source = sourceType === '0' ? cur[i].source : cur[i].target
        const target = sourceType === '0' ? cur[i].target : cur[i].source
        if (source && source === name && cur[i].is_wastage === false) {
          if (typeof target === 'string') {
            let t = '更多'
            let bval = ''
            let event_en = ''
            if (target.indexOf('!_!') > -1) {
              t = target.split('!_!')[1]
              const bval_temp1 = target.split('!_!')[0]
              if (bval_temp1.split('#_#')[1]) {
                bval = `(${bval_temp1.split('#_#')[1]})`
                event_en = `${bval_temp1.split('#_#')[1]}`
              }
            } else {
              t = target.split('#_#')[1]
            }

            listData.push({
              eventNameEn: event_en ? `${t}&${event_en}` : t,
              eventName:
                (t === '更多'
                  ? '更多'
                  : eventNameDescMap[t]
                    ? eventNameDescMap[t]
                    : target) + `${bval}`,
              times: cur[i].times,
              percent:
                total === 0
                  ? '0%'
                  : Math.round((cur[i].times / total) * 10000) / 100 + '%',
            })
            totalNext += parseFloat(cur[i].times)
          }
        }
      }
    }
    const totalNextPrecent =
      total === 0 ? '0%' : Math.round((totalNext / total) * 10000) / 100 + '%'
    nodeList.clickedNode.totalNext = totalNext
    nodeList.clickedNode.totalNextPrecent = totalNextPrecent
    nodeList.clickedNode.listData = listData

    if (listData.length > 0) {
      const wastage = total - totalNext
      const wastagePrecent =
        total === 0 ? '0%' : Math.round((wastage / total) * 10000) / 100 + '%'
      nodeList.clickedNode.wastage = wastage
      nodeList.clickedNode.wastagePrecent = wastagePrecent
    }
  }

  return {
    analysisResult,
    nodeList,
    echoGlobalFilters,
    getEchartsData,
    highLightNode,
    cancelHighLight,
    reCalcute,
    showNodeDetail,
  }
}
