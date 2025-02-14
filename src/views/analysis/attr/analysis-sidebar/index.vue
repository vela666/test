<template>
  <AnalysisLeft>
    <!-- 指标 -->
    <AliasEdit v-model="analysis.metric">
      <template #default="{ i }">
        <PropsCascader
          isAttrAnalysis
          :list="analysis.userFieldsData"
          v-model="analysis.metric[i].eventFields"
          @change="userFieldsChange(i)" />
      </template>
    </AliasEdit>

    <!-- 分组项 start-->
    <DescriptionLabel
      :label="$t('analysis.groupItems')"
      icon="analysis-group" />
    <div class="ml20 mb10">
      <div>{{ $t('analysis.attr.comparisonCrowds') }}</div>
      <el-switch v-model="isCrowd"></el-switch>
    </div>

    <template v-if="!isCrowd">
      <AnalysisGroup
        :data="groupFieldsData"
        :disabledGroups="disabledGroups"
        :filterable="false"
        v-model="state.conditionGroups"
        @remove="removeGroupItem" />
      <ActionBtn
        v-if="state.conditionGroups.length < 2"
        :label="$t('analysis.addGroup')"
        icon="add-index"
        @click="addGroupIterm"
        class="ml20" />
    </template>

    <!-- 人群对比 -->
    <template v-else>
      <AliasEdit
        v-model="analysis.crowdEvents"
        hasIndex
        :placeholder="$t('analysis.attr.crowdPlaceholder')">
        <template #default="{ i }">
          <PropsFilter
            :data="state.globalFieldsData"
            v-model="analysis.crowdEvents[i]"
            @add="(fIndex) => addEventFilter(fIndex, i)"
            @remove="
              (fIndex, subfIndex) => removeEventFilter(fIndex, subfIndex, i)
            "
            required />
          <ActionBtn
            :label="$t('analysis.addConditions')"
            icon="funnel-filter"
            style="display: block; margin-left: 6px"
            @click="(fIndex) => addEventFilter(fIndex, i)" />
        </template>
        <template #action-r="{ i }">
          <ActionBtn
            :content="$t('analysis.attr.copyCrowd')"
            icon="copy-index"
            @click="copyEvent(i)"
            type="icon" />
          <ActionBtn
            :content="$t('analysis.attr.deleteCrowd')"
            icon="delete2"
            v-if="analysis.crowdEvents.length > 2"
            @click="removeEvent(i)"
            type="icon" />
        </template>
      </AliasEdit>
      <ActionBtn
        v-if="analysis.crowdEvents.length < 10"
        :label="$t('analysis.attr.addComparisonCrowds')"
        icon="add-index"
        @click="createEvent"
        class="ml20" />
    </template>
    <!-- 分组项 end-->

    <!-- 条件 -->
    <template v-if="!isCrowd">
      <AnalysisGlobalFilter
        :title="$t('analysis.attr.userAccordWith')"
        v-model="state.conditionFilters"
        :data="state.globalFieldsData"
        @add="addGlobalFilter"
        @remove="removeGlobalFilter" />
    </template>

    <template #footer>
      <AnalysisFooter
        reportType="attr"
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
import { ref, watch, nextTick, computed, useAttrs } from 'vue'
import {
  AnalysisFooter,
  DescriptionLabel,
  ActionBtn,
  AliasEdit,
  AnalysisGroup,
} from '@/views/analysis/components/AnalysisSideBar'
import { useAnalysisHooks } from '@/views/analysis/hooks/analysisHooks'
import { useAttrsHooks } from '../hooks/attrsEventHooks'
import useOperate from '@/components/PropsFilter/useOperate'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { getFieldList } from '@/api/modules/analysis/common.js'

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
  reportInfo: {
    type: Object,
    default: () => {},
  },
  timeZone: {
    type: [String, Number],
    default: '',
  },
  sortArr: {
    type: Array,
    default: () => [],
  },
  sortType: {
    type: String,
    default: 'descend',
  },
})

const emit = defineEmits(['calcute', 'update:timeZone'])

const { parseFiltersFromRes } = useOperate()

const timeZoneStore = useTimeZoneStore()

const isCrowd = ref(false)

watch(isCrowd, (val) => {
  if (val && analysis.crowdEvents.length === 0) {
    for (let i = 0; i < 2; i++) {
      createEvent()
    }
  }
})

const limit = ['userField', 'userCluster', 'userLabel', 'customTableList']

const {
  state,
  groupFieldsData,
  disabledGroups,
  addGlobalFilter,
  removeGlobalFilter,
  addGroupIterm,
  removeGroupItem,
  echoGroupItem,
} = useAnalysisHooks({
  limit,
  reportType: 'attr',
})

const {
  analysis,
  addEventFilter,
  removeEventFilter,
  createEvent,
  copyEvent,
  removeEvent,
  userFieldsChange,
  getParams,
} = useAttrsHooks(state, isCrowd, props)

/**
 * @description: 开始分析
 * @return {*}
 */
const selectData = defineModel('selectData')
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
  cb(JSON.stringify(params))
}

/**
 * @description: 填充草稿
 * @return {*}
 */
const paddingDraft = (data) => {
  echoDetail(JSON.parse(data.draftData))
}

/**
 * @description: 条件回显
 * @return {*}
 * @param {*} data
 */
const echoDetail = async (data, cb) => {
  console.log(data)
  const { events, groupBy, userCrowds, timeZone = '8' } = data
  if (timeZone) {
    timeZoneStore.timeZone = timeZone
  }
  state.needOmitWatch = false

  analysis.metric[0] = {
    alias: events.analysisDesc,
    eventFields: {
      ...events,
    },
  }

  analysis.crowdEvents = userCrowds.map((item) => {
    item.alias = item.crowdName
    item.aliasRename = item.crowdName
    return {
      ...item,
      ...parseFiltersFromRes(item),
    }
  })
  analysis.crowdIndex = userCrowds.length
  isCrowd.value = userCrowds.length > 0 ? true : false
  state.conditionFilters = parseFiltersFromRes(events)
  const { data: Lists } = await getFieldList()
  state.conditionGroups = echoGroupItem(groupBy, Lists)

  emit('update:timeZone', timeZone)

  emit('echoGlobalFilters', {
    sortArr: data.sortArr,
    sortType: data.sortType,
  })

  cb && cb()
}

watch(
  () => props.reportInfo,
  (val) => {
    if (val) reportDetail(val, val.fromSave)
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
  getParams,
})
</script>

<style lang="scss" scoped></style>
