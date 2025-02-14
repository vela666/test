<template>
  <el-space :size="12" class="footer-space_content">
    <AnalysisDraft
      :reportType="report_type"
      @save="handleSaveDraft"
      @padding="handlePaddingDraft" />
    <SaveReport
      v-if="route.query.id && authEnum[report_type]?.add"
      :text="$t('analysis.saveAs')"
      :reportType="report_type"
      :qp="qp"
      :chartType="graphType"
      :reportInfo="reportInfo"
      type="1"
      v-bind="attrs" />

    <SaveReport
      v-if="
        (route.query.id &&
          authEnum[report_type]?.upd &&
          reportInfo?.authority > 1) ||
        (!route.query.id && authEnum[report_type]?.add)
      "
      :reportType="report_type"
      :qp="qp"
      :chartType="graphType"
      :text="
        route.query.id ? $t('analysis.updateReport') : $t('analysis.saveReport')
      "
      :reportInfo="reportInfo"
      v-bind="attrs" />
    <el-button type="primary" @click="calcute" :loading="loading">
      {{ $t('analysis.startAnalysis') }}
    </el-button>
  </el-space>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { reportTypeEnum, reportTypeListMap } from '@/enumeration/report'
import { chartTypeMap } from '../AnalysisMain'
import { useRoute } from 'vue-router'
import authEnum from '@/views/analysis/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'

const attrs = useAttrs()
const props = defineProps({
  reportType: {
    type: String,
    default: '',
    required: true,
  },
  qp: {
    type: [Function, Object],
    default: () => {},
    required: true,
  },
  chartType: {
    type: [String, Number],
    default: '',
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  reportInfo: {
    type: Object,
    default: () => {},
  },
})

const graphType = computed(() => {
  return typeof props.chartType === 'number'
    ? props.chartType
    : props.chartType && chartTypeMap.get(props.chartType)[0].graphType
})

const report_type = computed(() => reportTypeEnum.get(props.reportType))

const emit = defineEmits([
  'calcute',
  'saveDraft',
  'paddingDraft',
  'reportDetail',
])

const route = useRoute()

/**
 * @description: 保存草稿
 * @return {*}
 */
const handleSaveDraft = (cb) => {
  emit('saveDraft', cb)
}

// 计算
const calcute = () => {
  recordBehavior({
    moduleName: '分析',
    submoduleName: reportTypeListMap[report_type.value],
    operate: '开始分析',
  })
  emit('calcute')
}

/**
 * @description: 填充草稿，条件回显
 * @return {*}
 */
const handlePaddingDraft = (data) => {
  emit('paddingDraft', data)
}

defineOptions({
  name: 'AnalysisFooter',
})
</script>

<style lang="scss">
.footer-space_content {
  .el-space__item:last-of-type {
    margin-right: 0 !important;
  }
}
</style>
