<template>
  <AnalysisLeft>
    <div class="ml20">
      <AnalysisIndexLabel
        class="mb5"
        :label="t('analysis.attributed.analysisSubject')" />
      <DropSelectorSingle disabled type="custom">
        <template #default>
          <el-button class="h28">
            {{ t('analysis.attributed.user') }}
          </el-button>
        </template>
      </DropSelectorSingle>

      <AnalysisIndexLabel
        class="mt10 mb5"
        :label="t('analysis.attributed.attributionMethod')" />
      <DropSelectorSingle
        placement="bottom-end"
        v-model="analysis.model"
        type="custom"
        width="180"
        popperClass="attribution-method-drop"
        :data="attributionMethodList">
        <template #default="{ label }">
          <el-button class="h28">{{ label }}</el-button>
        </template>
        <template #content="{ item }">
          <div v-showTips class="nd-attribution-method-target">
            {{ item.label }}
          </div>
          <div class="nd-attribution-method-tip">{{ item.tips }}</div>
        </template>
      </DropSelectorSingle>

      <AnalysisIndexLabel
        class="mt10 mb5"
        :label="t('analysis.attributed.windowPeriod')" />
      <div class="flex-center">
        <DropSelectorSingle
          v-model="analysis.windowPeriodType"
          type="custom"
          :data="windowPeriodTypeList">
          <template #default="{ label }">
            <el-button class="h28">{{ label }}</el-button>
          </template>
        </DropSelectorSingle>
        <TimeRange
          v-if="analysis.windowPeriodType === 1"
          class="ml10"
          v-model="analysis.windowPeriodTimeVal"
          :title="t('analysis.funnel.analysisWindowPeriod')"
          :tip="t('analysis.funnel.analysisWindowPeriodTips')" />
      </div>
    </div>

    <AnalysisIndexLabel
      class="ml20 mt10"
      :label="t('analysis.attributed.targetEvent')" />
    <div class="analysis_item eas-block-container analysis-hover__bg">
      <AnalysisIndexItem
        :disabledIds="eventIds"
        v-model:event-data="analysis.targetEvent.events"
        v-model:event-fields="analysis.targetEvent.eventFields"
        v-model:event-filters="analysis.targetEvent.eventFilters"
        :eventFieldsList="analysis.targetEvent.eventFieldsData"
        :fieldsList="analysis.targetEvent.fieldsList"
        @addFilter="(index, fIndex) => addFilter('eventFilters', fIndex)"
        analysisType="14"
        @deleteFilter="
          (index, fIndex, subfIndex) =>
            deleteFilter('eventFilters', index, fIndex, subfIndex)
        "
        @eventChange="targetItemChange">
        <div class="mt10">
          <ActionBtn
            icon="funnel-filter"
            :label="t('analysis.addConditions')"
            @click="addFilter('eventFilters')" />
        </div>
      </AnalysisIndexItem>

      <AnalysisGroup
        className="p0 m0"
        :dragable="false"
        :data="targetGroupFieldsData"
        v-model="targetGroup.state.conditionGroups"
        @remove="targetGroup.removeGroupItem">
        <span class="mr10">{{ t('analysis.groupItems') }}</span>
      </AnalysisGroup>

      <ActionBtn
        v-if="targetGroup.state.conditionGroups.length < 1"
        :label="t('analysis.addGroup')"
        icon="add-index"
        @click="targetGroup.addGroupIterm" />
    </div>

    <AnalysisIndexLabel
      class="ml20 mt20"
      :label="t('analysis.attributed.attributionEvent')" />
    <div class="ml20">
      <el-checkbox
        v-model="analysis.directConversion"
        :label="
          t('analysis.attributed.directConversionInvolvedInAttribution')
        " />

      <div>{{ t('analysis.attributed.attributionEventGrouping') }}：</div>
      <el-radio-group
        v-if="!!analysis.attrEvents.length"
        @change="attributedGruopChange"
        v-model="analysis.attributedGruopType">
        <el-radio :value="1" class="mr20">
          {{ t('analysis.attributed.sharedGrouping') }}
        </el-radio>
        <el-radio :value="2">
          {{ t('analysis.attributed.singleEventGrouping') }}
        </el-radio>
      </el-radio-group>
    </div>

    <AliasEdit
      :editable="false"
      v-model="analysis.attrEvents"
      hasIndex
      dragable>
      <template #default="{ i }">
        <div class="flex-center flex-between">
          <AnalysisIndexItem
            :disabledIds="eventIds"
            :showEventFields="false"
            @eventChange="attrEventChange(analysis.attrEvents[i])"
            v-model:event-data="analysis.attrEvents[i].events"
            v-model:event-filters="analysis.attrEvents[i].eventFilters"
            :fieldsList="analysis.attrEvents[i].fieldsList"
            @addFilter="(index, fIndex) => addFilter('attrEvents', i, fIndex)"
            analysisType="14"
            @deleteFilter="
              (index, fIndex, subfIndex) =>
                deleteFilter('attrEvents', i, fIndex, subfIndex)
            ">
            <div class="mt10">
              <ActionBtn
                icon="funnel-filter"
                :label="t('analysis.addConditions')"
                @click="addFilter('attrEvents', i)" />
            </div>
            <template #split>
              <AssociatedAttr
                :targetEventId="targetEventId"
                v-model="analysis.attrEvents[i]" />
            </template>
          </AnalysisIndexItem>

          <ActionBtn
            v-if="analysis.attrEvents.length > 1"
            :content="t('btn.delete')"
            icon="delete2"
            class="alias-edit__icon"
            @click="removeAttributionEvent(i)"
            type="icon" />
        </div>
        <div class="mt10 flex flex-column flex-align-items-start">
          <template v-if="analysis.attributedGruopType === 2">
            <ActionBtn
              v-if="analysis.attrEvents[i].groupBy.length < 1"
              :label="t('analysis.addGroup')"
              icon="add-index"
              @click="addGroupIterm(analysis.attrEvents[i])"
              class="m0" />
            <AnalysisGroup
              className="p0 m0 "
              :dragable="false"
              :data="analysis.attrEvents[i].groupFieldsData"
              v-model="analysis.attrEvents[i].groupBy"
              @remove="
                (index) => removeGroupItem(analysis.attrEvents[i], index)
              ">
              <span class="mr10">{{ t('analysis.groupItems') }}</span>
            </AnalysisGroup>
          </template>
        </div>
      </template>
    </AliasEdit>

    <div class="ml20 flex flex-column flex-align-items-start gap10">
      <ActionBtn
        v-if="analysis.attrEvents.length < 5"
        :label="t('analysis.attributed.addAttributionEvent')"
        icon="add-index"
        @click="createAttributionEvent" />
    </div>

    <div class="ml20">
      <AnalysisGroup
        className="p0 m0"
        :dragable="false"
        :data="commonGroupFieldsData"
        v-model="commonGroup.state.conditionGroups"
        @remove="commonGroup.removeGroupItem"
        :disabledGroups="commonDisabledGroups">
        <span class="mr10">{{ t('analysis.groupItems') }}</span>
      </AnalysisGroup>
      <ActionBtn
        v-if="
          !!analysis.attrEvents.length &&
          analysis.attributedGruopType === 1 &&
          commonGroup.state.conditionGroups.length < 5
        "
        :label="t('analysis.addGroup')"
        icon="add-index"
        @click="commonGroup.addGroupIterm"
        class="m0 mb10 mt5" />
    </div>

    <AnalysisGlobalFilter
      v-model="state.conditionFilters"
      :data="state.globalFieldsData"
      @add="addGlobalFilter"
      @remove="removeGlobalFilter" />

    <template #footer>
      <AnalysisFooter
        reportType="attributed"
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
import { nextTick, watch, useAttrs } from 'vue'
import {
  AnalysisFooter,
  ActionBtn,
  AnalysisGroup,
  AnalysisIndexLabel,
  AliasEdit,
} from '@/views/analysis/components/AnalysisSideBar'
import { useAnalysisHooks } from '@/views/analysis/hooks/analysisHooks'
import useSidebarHooks from '../hooks/sidebarHooks'
import { ElMessage } from 'element-plus'
import TimeRange from '../TimeRange/index.vue'
import AssociatedAttr from '../AssociatedAttr/index.vue'
import { t } from '@/locales/i18n'
import useOperate from '@/components/PropsFilter/useOperate.js'

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
})
const emit = defineEmits(['calcute', 'echoGlobalFilters'])

const attributionMethodList = [
  {
    label: t('analysis.attributed.firstTouchAttribution'),
    value: 1,
    tips: t('analysis.attributed.firstEventFullContribution'),
  },
  {
    label: t('analysis.attributed.lastTouchAttribution'),
    value: 0,
    tips: t('analysis.attributed.lastEventFullContribution'),
  },
  {
    label: t('analysis.attributed.linearAttribution'),
    value: 2,
    tips: t('analysis.attributed.equalContribution'),
  },
  {
    label: t('analysis.attributed.positionBasedAttribution'),
    value: 3,
    tips: t('analysis.attributed.firstLastWeightedContribution'),
  },
]

const windowPeriodTypeList = [
  { label: t('analysis.attributed.custom'), value: 1 },
  { label: t('analysis.attributed.today'), value: 2 },
]

const { parseFiltersFromRes } = useOperate()

const {
  state,
  addGlobalFilter,
  removeGlobalFilter,
  getGlobalFieldsData,
  echoGroupItem,
} = useAnalysisHooks({
  omitAttr: true, // 分组项是否过滤掉['__fid', '__bid', '__did']
  eventIds: true,
})

const { groupFieldsData: targetGroupFieldsData, ...targetGroup } =
  useAnalysisHooks({
    omitAttr: true, // 分组项是否过滤掉['__fid', '__bid', '__did']
    eventIds: true,
  })

const {
  groupFieldsData: commonGroupFieldsData,
  disabledGroups: commonDisabledGroups,
  ...commonGroup
} = useAnalysisHooks({
  omitAttr: true, // 分组项是否过滤掉['__fid', '__bid', '__did']
  eventIds: true,
})

const {
  analysis,
  eventIds,
  targetEventId,
  attrEventsIds,
  currentEventList,
  addFilter,
  deleteFilter,
  getParams,
  addGroupIterm,
  removeGroupItem,
  setIndexDisplay, // 指标回显
  attrEventChange,
  targetItemChange,
  getGroupFieldsData,
  initBeforeGetEvents,
  createAttributionEvent,
  removeAttributionEvent,
  attributedGruopChange,
} = useSidebarHooks({ state, props, targetGroup, commonGroup })

watch(eventIds, (val) => {
  getGlobalFieldsData(val.join(','))
})

watch(targetEventId, (val) => {
  targetGroup.getGlobalFieldsData(val)
})

watch(attrEventsIds, (val) => {
  if (!val.length) return
  commonGroup.getGlobalFieldsData(val.join(','))
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

// 处理分群规则数据
const mapAttrEventsData = async (attrEvents) => {
  const newAttrEvents = await setIndexDisplay(attrEvents)
  // 事件
  const temp = []
  for (let index = 0; index < newAttrEvents.length; index++) {
    const item = newAttrEvents[index]
    const groupFieldsData = await getGroupFieldsData(item.events.eventId)
    temp.push({
      ...item,
      groupBy: echoGroupItem(attrEvents[index].groupBy),
      joinOn: attrEvents[index].joinOn,
      associatedAttributeStatus: attrEvents[index].associatedAttributeStatus,
      associatedAttributeData: attrEvents[index].associatedAttributeData,
      groupFieldsData,
    })
  }
  analysis.attrEvents = temp
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
    model,
    directConversion,
    groupBy,
    eventView,
    eventView: { timeZone = '8' },
    targetEvent,
    windowPeriodType,
    attributedGruopType,
    windowPeriodTimeVal,
    globalFilts,
    attrEvents,
  } = data
  analysis.windowPeriodType = windowPeriodType
  analysis.windowPeriodTimeVal = windowPeriodTimeVal
  emit('echoGlobalFilters', {
    dateRange: eventView,
    timeZone,
    sortArr: data.sortArr,
  })
  analysis.model = model
  analysis.directConversion = directConversion
  analysis.attributedGruopType = attributedGruopType
  state.conditionFilters = parseFiltersFromRes(globalFilts)

  commonGroup.state.conditionGroups = echoGroupItem(groupBy)
  const item = await setIndexDisplay([targetEvent])
  analysis.targetEvent = item[0]
  await mapAttrEventsData(attrEvents)
  targetGroup.state.conditionGroups = echoGroupItem(targetEvent.groupBy)

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

defineOptions({
  name: 'AttributedSidebar',
})
</script>

<style lang="scss">
.attribution-method-drop {
  > .el-scrollbar {
    overflow: visible;
    > .el-scrollbar__wrap {
      overflow: visible;
    }
    > .el-scrollbar__bar {
      display: none !important;
    }
    .custom-content-item {
      &:after {
        content: '';
        position: absolute;
        top: 0;
        left: 15px;
        z-index: -5;
        height: 100%;
        width: 100%;
        &:hover {
          .nd-attribution-method-tip {
            display: block;
          }
        }
      }
      &:hover {
        .nd-attribution-method-tip {
          display: block;
        }
      }
    }
  }
}
.analysis-alias {
  &:hover {
    .delete-icon {
      display: inherit;
    }
  }
}
</style>
<style lang="scss" scoped>
.analysis_item {
  margin: 4px 10px 0px;
  padding: 10px;
}

.nd-attribution-method-tip {
  display: none;
  position: absolute;
  padding: 10px;
  left: 182px;
  width: 200px;
  background: #ffffff;
  border: 1px solid #e7e7ea;
  border-radius: 4px;
  color: var(--eas-text-color-light);
  box-shadow: 0px 3px 10px 0px rgba(28, 32, 40, 0.18);
}
</style>
