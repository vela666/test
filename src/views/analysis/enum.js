import { getButtonAuthList } from '@/utils/dataProcessing'
// import authEnum from '@/views/analysis/enum.js'

const analysisType = {
  // 事件分析
  1: 'behavior',
  // 留存分析
  2: 'retention-analysis',
  // 漏斗分析
  3: 'funnel-analysis',
  // 用户分析
  4: 'attr-analysis',
  // 路径分析
  5: 'path-analysis',
  // 分布分析
  6: 'scatter-analysis',
  // SQL查询
  7: 'sql-query',
  // 间隔分析
  8: 'interval-analysis',
  // LTV分析
  9: 'ltv-analysis',
  // 归因分析
  14: 'attributed-analysis',
}

export default Object.keys(analysisType).reduce((p, item) => {
  p[item] = getButtonAuthList(analysisType[item] + ':').authEnum
  return p
}, {})
