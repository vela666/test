<template>
  <AnalysisLeft>
    <!-- 指标 -->
    <AliasEdit
      v-model="analysis"
      hasIndex
      dragable
      :title="$t('analysis.funnel.funnelSteps')">
      <template #default="{ i, item }">
        <IndexSelect
          v-model="analysis[i]"
          @change="(val) => eventChange(val, i)" />
        <PropsFilter
          v-if="analysis?.[i]?.filters?.length > 0"
          :data="item.eventFieldsData"
          v-model="analysis[i]"
          :limit="['eventField']"
          @add="(fIndex) => addEventFilter(i, fIndex)"
          @remove="
            (fIndex, subfIndex) => removeEventFilter(i, fIndex, subfIndex)
          " />
        <div class="mt10">
          <ActionBtn
            :label="$t('analysis.addConditions')"
            icon="funnel-filter"
            @click="addEventFilter(i)"
            class="mr10" />

          <template
            v-if="
              item.filters.length >= 1 &&
              item.filters[0].selectedList?.length > 1
            ">
            <el-tooltip effect="dark" placement="right">
              <template #content>
                <div
                  v-html="
                    $t('analysis.funnel.filesTooltip').replace(/\n/g, '<br />')
                  "></div>
                <!-- 在有一个或多个筛选项<br />
                  时，根据第一个筛选项（不包含嵌套筛选条件）<br />
                  中的多个筛选值生成步骤 -->
              </template>
              <ActionBtn
                :label="$t('analysis.funnel.produce')"
                icon="files"
                @click="generateEventFilter(i)" />
            </el-tooltip>
          </template>
        </div>
      </template>
      <template #action-r="{ i }">
        <ActionBtn
          :content="$t('analysis.copyIndicators')"
          icon="copy-index"
          @click="copyEvent(i)"
          type="icon" />
        <ActionBtn
          :content="$t('analysis.deleteIndicators')"
          icon="delete2"
          v-if="analysis.length > 2"
          @click="removeEvent(i)"
          type="icon" />
      </template>
    </AliasEdit>
    <ActionBtn
      v-if="analysis.length < 20"
      :label="$t('analysis.funnel.addStepIndicators')"
      icon="add-index"
      @click="createEvent"
      class="ml20 mt10" />

    <div class="ml20 mt20">
      <div style="font-weight: bold">{{ $t('analysis.funnel.nextStep') }}</div>
      <el-switch v-model="enableCoincide"></el-switch>
    </div>
    <!-- 分析窗口期 -->
    <AnalysisDuration
      v-model="windowsGap"
      :title="$t('analysis.funnel.analysisWindowPeriod')"
      :tip="$t('analysis.funnel.analysisWindowPeriodTips')" />

    <AnalysisGlobalFilter
      v-model="state.conditionFilters"
      :data="state.globalFieldsData"
      @add="addGlobalFilter"
      @remove="removeGlobalFilter" />

    <DescriptionLabel
      :label="$t('analysis.groupItems')"
      icon="analysis-group" />
    <AnalysisGroup
      :data="groupFieldsData"
      :disabledGroups="disabledGroups"
      :dragable="false"
      v-model="state.conditionGroups"
      @remove="removeGroupItem" />
    <ActionBtn
      v-if="state.conditionGroups.length < 1"
      :label="$t('analysis.addGroup')"
      icon="add-index"
      @click="addGroupIterm"
      class="ml20" />
    <template #footer>
      <AnalysisFooter
        reportType="funnel"
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
import { computed, watch, nextTick, useAttrs, watchEffect } from 'vue'
import {
  AnalysisFooter,
  DescriptionLabel,
  ActionBtn,
  AliasEdit,
  AnalysisGroup,
} from '@/views/analysis/components/AnalysisSideBar'
import { useAnalysisHooks } from '@/views/analysis/hooks/analysisHooks'
import { useFunnelSidebarHooks } from '../hooks/funnelSidebarHooks'
import useOperate from '@/components/PropsFilter/useOperate'
import useEventStore from '@/store/modules/event.js'
import { ElMessage } from 'element-plus'
import { cloneDeep, isObject } from 'lodash-es'
import { useRoute } from 'vue-router'
import { t } from '@/locales/i18n'

const router = useRoute()
const attrs = useAttrs()
const props = defineProps({
  chartType: {
    type: [String, Number],
    default: '',
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
  timeZone: {
    type: [String, Number],
    default: '',
  },
  funnelType: {
    type: String,
    default: '',
  },
  steps: {
    type: Array,
    default: () => [],
  },
  groupCheck: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits(['calcute', 'echoGlobalFilters'])

const { parseFiltersFromRes } = useOperate()
const eventStore = useEventStore()
const currentEventList = computed(() => eventStore.currentEventList)

const {
  state,
  groupFieldsData,
  getGlobalFieldsData,
  addGlobalFilter,
  removeGlobalFilter,
  disabledGroups,
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
  windowsGap,
  enableCoincide,
  createEvent,
  removeEvent,
  copyEvent,
  eventChange,
  addEventFilter,
  generateEventFilter,
  removeEventFilter,
  getParams,
  initBeforeGetEvents,
  generateDefaultCluster,
} = useFunnelSidebarHooks(state, props)

watch(eventIds, (val) => {
  getGlobalFieldsData(val)
})

if (!router?.query?.id) {
  const stopWf = watchEffect(
    () => {
      const data = cloneDeep(state.globalFieldsData)
      if (isObject(data) && Object.keys(data).length > 0) {
        const item = generateDefaultCluster(
          data?.defaultCluster?.[0],
          router.path
        )
        if (item && isObject(item) && Object.keys(item).length > 0) {
          state.conditionFilters.filters.push(item)
        }
        stopWf()
      }
    },
    {
      flush: 'post',
    }
  )
}

const selectData = defineModel('selectData')
/**
 * @description: 开始分析
 * @return {*}
 */
const calcute = (type) => {
  const params = getParams()
  if (!params) return
  selectData.value = type === 'refresh'
  emit('calcute', params, type)
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
    globalFilts,
    events,
    groupBy,
    enableCoincide: enableCoin,
    windowsGapMs,
    windowsGapTu,
    diff,
    endTime,
    recentDay,
    shortcutType,
    startTime,
    timeZone = '8',
    funnelType,
    steps,
  } = data

  let groupCheck = []
  if (data.groupCheck && data.groupCheck.groups) {
    groupCheck = data.groupCheck.groups || []
  } else if (Array.isArray(data.groupCheck)) {
    groupCheck = data.groupCheck
  }

  const eventsList = []
  // 步骤指标
  for (let i = 0; i < events.length; i++) {
    const obj = {
      alias: events[i].eventNameDisplay || events[i].eventDesc,
      ...events[i],
      ...parseFiltersFromRes(events[i]),
    }

    const res = await createEvent(obj, 'echo')
    eventsList.push(res)
  }

  state.conditionFilters = parseFiltersFromRes(globalFilts)
  state.conditionGroups = echoGroupItem(groupBy)
  windowsGap.time = windowsGapMs
  windowsGap.type = windowsGapTu
  enableCoincide.value = Boolean(enableCoin)

  analysis.value = eventsList

  // 时间回显
  const date = {
    diff,
    endTime,
    recentDay,
    shortcutType,
    startTime,
  }

  emit('echoGlobalFilters', {
    dateRange: date,
    timeZone,
    funnelType,
    steps,
    groupCheck,
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
        calcute('detail')
      }
    })
  })
}

defineExpose({
  calcute,
})
</script>
