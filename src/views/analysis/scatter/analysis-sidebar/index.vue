<template>
  <AnalysisLeft>
    <AnalysisIndexLabel
      :label="$t('analysis.scatter.userParticipationEvent')"
      class="ml20" />
    <div class="analysis_item eas-block-container analysis-hover__bg">
      <AliasAndDecimal
        class="mb5"
        v-if="analysis.customizable"
        :list="decimalList"
        v-model:alias="analysis.events.alias"
        v-model:round="analysis.events.round" />

      <AnalysisIndexItem
        v-model:formula="analysis.events.code"
        v-model:event-data="analysis.events.events"
        v-model:event-fields="analysis.events.eventFields"
        v-model:event-filters="analysis.events.eventFilters"
        :eventFieldsList="analysis.events.eventFieldsData"
        :fieldsList="analysis.events.fieldsList"
        :customizable="analysis.customizable"
        analysisType="2"
        @addFilter="addFilter"
        @deleteFilter="deleteFilter"
        @eventChange="eventChange"
        @customEventChange="customEventChange"
        anyEvent>
        <template #append>
          <div :style="{ 'margin-left': analysis.customizable ? 0 : '8px' }">
            <GroupRange
              v-model="analysis.events.range"
              :data="analysis.rangeList" />
          </div>
        </template>
        <div class="mt10">
          <ActionBtn
            icon="funnel-filter"
            :label="$t('analysis.addConditions')"
            @click="addFilter" />
          <ActionBtn
            icon="custom-index"
            :label="
              analysis.customizable
                ? $t('analysis.returnIndicatorSelection')
                : $t('analysis.switchCustomIndicators')
            "
            @click="changeCustomizable" />
        </div>
      </AnalysisIndexItem>
    </div>

    <DescriptionLabel
      :label="$t('analysis.groupItems')"
      icon="analysis-group" />
    <AnalysisGroup
      :data="groupFieldsData"
      v-model="state.conditionGroups"
      :disabledGroups="disabledGroups"
      @remove="removeGroupItem" />
    <ActionBtn
      v-if="state.conditionGroups.length < 10"
      :label="$t('analysis.addGroup')"
      icon="add-index"
      @click="addGroupIterm"
      class="ml20" />

    <template #footer>
      <AnalysisFooter
        reportType="scatter"
        :chartType="chartType"
        :loading="loading"
        :reportInfo="reportInfo"
        :qp="getParams"
        @calcute="calcute"
        @saveDraft="saveDraft"
        @paddingDraft="paddingDraft"
        v-bind="attrs" />
    </template>
  </AnalysisLeft>
</template>

<script setup>
import { nextTick, watch, computed, useAttrs } from 'vue'
import {
  AnalysisFooter,
  DescriptionLabel,
  ActionBtn,
  AnalysisGroup,
  AnalysisIndexLabel,
} from '@/views/analysis/components/AnalysisSideBar'
import { useAnalysisHooks } from '@/views/analysis/hooks/analysisHooks'
import { useScatterSidebarHooks } from '../hooks/scatterSidebarHooks'
import { ElMessage } from 'element-plus'
import { cloneDeep, isEmpty } from 'lodash-es'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'ScatterSidebar',
})

const attrs = useAttrs()
const props = defineProps({
  chartType: {
    type: [String, Number],
    default: '',
  },
  sortArr: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  dateRange: {
    type: Object,
    default: () => {},
  },
  reportInfo: {
    type: Object,
    default: () => {},
  },
  timeParticle: {
    type: String,
    default: '',
  },
  firstDayOfWeek: {
    type: [String, Number],
    default: '',
  },
  // 近似计算
  approxVal: {
    type: [String, Number],
    default: '',
  },
  timeZone: {
    type: [String, Number],
    default: '',
  },
})
const emit = defineEmits(['calcute', 'echoGlobalFilters'])

const decimalList = [
  { label: t('analysis.round'), value: 0 },
  { label: t('analysis.decimals', [2]), value: 1 },
  { label: t('analysis.decimals', [4]), value: 3 },
  { label: t('analysis.decimals', [6]), value: 4 },
]

const {
  state,
  groupFieldsData,
  disabledGroups,
  getGlobalFieldsData,
  addGroupIterm,
  removeGroupItem,
  echoGroupItem,
} = useAnalysisHooks({
  omitAttr: true, // 分组项是否过滤掉['__fid', '__bid', '__did']
  eventIds: true,
})

const {
  analysis,
  eventIds,
  currentEventList,
  addFilter,
  deleteFilter,
  eventChange,
  customEventChange,
  changeCustomizable,
  getParams,
  setIndexDisplay, // 指标回显
  echoGroupRange,
  initBeforeGetEvents,
} = useScatterSidebarHooks(state, props)

watch(eventIds, (val) => {
  getGlobalFieldsData(val)
})

const selectData = defineModel('selectData')
/**
 * @description: 开始分析
 * @return {*}
 */
const calcute = (type) => {
  const params = getParams()
  if (!params) return
  selectData.value = type === 'refresh'
  emit('calcute', params)
}

/**
 * @description: 保存草稿
 * @return {*}
 */
const saveDraft = (cb) => {
  const params = getParams()
  if (!params) return
  const data = {
    ...params,
    dateRange: props.dateRange,
  }
  cb(JSON.stringify(data))
}

/**
 * @description: 填充草稿
 * @return {*}
 */
const paddingDraft = (data) => {
  echoDetail(JSON.parse(data.draftData))
}

/**
 * @description: 报表详情回显
 * @return {*}
 */
const echoDetail = async (data, cb) => {
  if (currentEventList.value.length === 0) {
    ElMessage.success(t('analysis.indicatorsEmpty'))
    return
  }
  state.needOmitWatch = false
  const {
    groupBy,
    diff,
    endTime,
    recentDay,
    shortcutType,
    startTime,
    events,
    timeParticle,
    firstDayOfWeek = 1,
    approxVal = 2,
    timeZone = '8',
  } = data

  const item = await setIndexDisplay([events])

  analysis.events = cloneDeep(item[0])
  analysis.customizable = item[0].customizable

  nextTick(() => {
    echoGroupRange({
      intervalType: events.intervalType,
      quotaIntervalArr: events.quotaIntervalArr,
    })
  })

  state.conditionGroups = echoGroupItem(groupBy)

  const date = {
    diff,
    startTime,
    endTime,
    recentDay,
    shortcutType,
  }

  emit('echoGlobalFilters', {
    dateRange: date,
    firstDayOfWeek,
    timeParticle,
    approxVal,
    timeZone,
    sortArr: data.sortArr,
  })

  cb && cb()
}

watch(
  () => props.reportInfo,
  (val) => {
    if (val) {
      initBeforeGetEvents(async () => {
        await reportDetail(val, val.fromSave)
      })
    }
  },
  {
    immediate: true,
  }
)

/**
 * @description: 获取报表详情
 * @return {*}
 * @param {*} info
 * @param {*} fromSave 从保存场景来的,不重新计算
 */
function reportDetail(info, fromSave = false) {
  const data = JSON.parse(info.qp)
  echoDetail(data, () => {
    nextTick(() => {
      if (!fromSave) {
        calcute()
      }
    })
  })
}

defineExpose({
  calcute,
})
</script>

<style lang="scss" scoped>
.analysis_item {
  margin: 4px 10px 0px;
  padding: 10px;
}
</style>
