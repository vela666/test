<script setup>
import { ref, nextTick, watch, useAttrs } from 'vue'
import {
  AnalysisFooter,
  ActionBtn,
  AnalysisIndexLabel,
} from '@/views/analysis/components/AnalysisSideBar'
import useRetentionSidebar from './hooks/useRetentionSidebar.js'
defineOptions({
  name: 'RetentionSidebar',
})

const attrs = useAttrs()
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  reportInfo: {
    type: Object,
    default: () => ({}),
  },
  mainState: {
    type: Object,
    default: () => ({}),
  },
})
const emits = defineEmits(['analysis'])
const {
  state,
  addFilter,
  deleteFilter,
  eventChange,
  addGlobalFilter,
  deleteGlobalFilter,
  switchIndexStatus,
  groupdsFieldsData,
  addGroupItem,
  removeGroupItem,
  getRequestParams,
  startAnalysis,
  initBeforeGetEvents,
  echoReportAndDraft,
} = useRetentionSidebar(emits, props)

const leftLoding = ref(false)

/**
 * @description: 保存草稿
 * @return {*}
 */
const saveDraft = (cb) => {
  const params = getRequestParams(true)
  if (!params) return
  cb(JSON.stringify(params))
}

/**
 * @description: 填充草稿
 * @return {*}
 */
const paddingDraft = async (data) => {
  leftLoding.value = true
  await echoReportAndDraft(JSON.parse(data.draftData))
  leftLoding.value = false
  nextTick(() => {
    startAnalysis()
  })
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
  initBeforeGetEvents(async () => {
    leftLoding.value = true
    await echoReportAndDraft(data)
    leftLoding.value = false
    nextTick(() => {
      if (!fromSave) {
        startAnalysis(true)
      }
    })
  })
}

defineExpose({
  startAnalysis,
})
</script>

<template>
  <analysis-left :loading="leftLoding">
    <div class="pl10 pr10">
      <!-- 初始事件 -->
      <AnalysisIndexLabel
        :label="$t('analysis.retention.initialEvent')"
        class="pl10 pr10" />
      <div class="analysis_item eas-block-container">
        <AnalysisIndexItem
          index="initialEvent"
          :showEventFields="false"
          v-model:event-data="state.initialEvent.events"
          v-model:event-filters="state.initialEvent.eventFilters"
          :fieldsList="state.initialEvent.fieldsList"
          @addFilter="addFilter"
          @deleteFilter="deleteFilter"
          @eventChange="eventChange"
          anyEvent>
          <ActionBtn
            icon="funnel-filter"
            :label="$t('analysis.addConditions')"
            class="mg_t10_b0"
            @click="addFilter('initialEvent')" />
        </AnalysisIndexItem>
      </div>
      <!-- 回访事件 -->
      <AnalysisIndexLabel
        :label="$t('analysis.retention.returnVisitEvent')"
        class="pl10 pr10" />
      <div class="analysis_item eas-block-container">
        <AnalysisIndexItem
          index="returnVisitEvent"
          :showEventFields="false"
          v-model:event-data="state.returnVisitEvent.events"
          v-model:event-filters="state.returnVisitEvent.eventFilters"
          :fieldsList="state.returnVisitEvent.fieldsList"
          @addFilter="addFilter"
          @deleteFilter="deleteFilter"
          @eventChange="eventChange"
          anyEvent>
          <ActionBtn
            icon="funnel-filter"
            :label="$t('analysis.addConditions')"
            class="mg_t10_b0"
            @click="addFilter('returnVisitEvent')" />
        </AnalysisIndexItem>
      </div>
      <!-- 同时展示回访用户参与 -->
      <AnalysisIndexLabel
        :label="$t('analysis.retention.returnVisitParticipation')"
        class="pl10 pr10" />
      <div class="pl10 pr10">
        <el-switch v-model="state.showUserAction" @change="switchIndexStatus" />
      </div>
      <div
        v-if="state.showUserAction"
        class="analysis_item eas-block-container">
        <AnalysisIndexItem
          index="userAction"
          v-model:event-data="state.userAction.events"
          v-model:event-fields="state.userAction.eventFields"
          v-model:event-filters="state.userAction.eventFilters"
          :eventFieldsList="state.userAction.eventFieldsData"
          :fieldsList="state.userAction.fieldsList"
          @addFilter="addFilter"
          @deleteFilter="deleteFilter"
          @eventChange="eventChange"
          anyEvent>
          <ActionBtn
            icon="funnel-filter"
            :label="$t('analysis.addConditions')"
            class="mg_t10_b0"
            @click="addFilter('userAction')" />
        </AnalysisIndexItem>
      </div>
    </div>
    <AnalysisGlobalFilter
      v-model="state.globalFilters"
      :data="state.globalFiledsData"
      @add="addGlobalFilter"
      @remove="deleteGlobalFilter" />
    <AnalysisGroups
      v-model="state.groupList"
      :data="groupdsFieldsData"
      :disabledGroups="state.groupList"
      @remove="(val) => removeGroupItem(val)">
      <template #btn>
        <el-button
          type="primary"
          text
          @click="addGroupItem"
          v-if="state.groupList.length < 5">
          <svg-icon name="add-index" class="fz16 mr3"></svg-icon>
          {{ $t('analysis.addGroup') }}
        </el-button>
      </template>
    </AnalysisGroups>
    <template #footer>
      <AnalysisFooter
        reportType="retention"
        :loading="loading"
        :chartType="mainState.graphType"
        :reportInfo="reportInfo"
        :qp="() => getRequestParams(true)"
        @calcute="startAnalysis"
        @saveDraft="saveDraft"
        @paddingDraft="paddingDraft"
        v-bind="attrs" />
    </template>
  </analysis-left>
</template>

<style scoped lang="scss">
.analysis_item {
  margin: 4px 0px 6px 0px;
  padding: 10px;
  &:hover {
    background-color: var(--eas-hover-color);
  }
}
.mg_t10_b0 {
  margin-top: 10px;
  margin-bottom: 0px;
}
</style>
