<script setup>
import {
  AnalysisFooter,
  ActionBtn,
  AnalysisIndexLabel,
} from '@/views/analysis/components/AnalysisSideBar'
import { ref, watch, nextTick, useAttrs } from 'vue'
defineOptions({
  name: 'LtvSidebar',
})
import useLtvSidebar from './hooks/useLtvSidebar.js'

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
  switchToUserProps,
  switchIndexStatus,
  addFilter,
  deleteFilter,
  addGlobalFilter,
  deleteGlobalFilter,
  eventChange,
  groupdsFieldsData,
  addGroupItem,
  removeGroupItem,
  switchIndex,
  switchTip,
  customEventChange,
  changeCalculateOrder,
  symbolsArr,
  startAnalysis,
  getRequestParams,
  initBeforeGetEvents,
  echoReportAndDraft,
} = useLtvSidebar(emits, props)

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
    <div class="index-area">
      <!-- 初始用户 -->
      <AnalysisIndexLabel
        :label="$t('analysis.ltv.initialUser')"
        class="padding_lr_10">
        <template #btn>
          <el-button text @click="switchToUserProps">
            <svg-icon name="index-switch" class="fz16 mr3"></svg-icon>
            {{ $t('analysis.ltv.switchTo') }}
            {{
              state.userPropSwitch
                ? $t('analysis.ltv.userEvent')
                : $t('analysis.ltv.userAttribute')
            }}
          </el-button>
        </template>
      </AnalysisIndexLabel>
      <div class="analysis_item eas-block-container">
        <PropsCascader
          v-if="state.userPropSwitch"
          :list="state.userProps"
          onlyProps
          v-model="state.initialEvent.userField" />
        <AnalysisIndexItem
          v-else
          index="initialEvent"
          :showEventFields="false"
          v-model:event-data="state.initialEvent.events"
          v-model:event-filters="state.initialEvent.eventFilters"
          :fieldsList="state.initialEvent.fieldsList"
          @addFilter="addFilter"
          @deleteFilter="deleteFilter"
          @eventChange="eventChange">
          <ActionBtn
            icon="funnel-filter"
            :label="$t('analysis.addConditions')"
            class="ltv-btn"
            @click="addFilter('initialEvent')" />
        </AnalysisIndexItem>
      </div>
      <!-- 回访用户指标 -->
      <AnalysisIndexLabel
        :label="$t('analysis.ltv.returnVisitIndicators')"
        class="padding_lr_10"></AnalysisIndexLabel>
      <div class="analysis_item eas-block-container">
        <AliasAndDecimal
          class="mb5"
          v-if="state.returnVisitEvent.customizable"
          v-model:alias="state.returnVisitEvent.alias"
          v-model:round="state.returnVisitEvent.round" />
        <AnalysisIndexItem
          index="returnVisitEvent"
          :analysisType="4"
          v-model:formula="state.returnVisitEvent.code"
          v-model:event-data="state.returnVisitEvent.events"
          v-model:event-fields="state.returnVisitEvent.eventFields"
          v-model:event-filters="state.returnVisitEvent.eventFilters"
          :eventFieldsList="state.returnVisitEvent.eventFieldsData"
          :fieldsList="state.returnVisitEvent.fieldsList"
          :customizable="state.returnVisitEvent.customizable"
          @addFilter="addFilter"
          @deleteFilter="deleteFilter"
          @eventChange="eventChange"
          @customEventChange="customEventChange">
          <ActionBtn
            icon="funnel-filter"
            :label="$t('analysis.addConditions')"
            class="ltv-btn"
            @click="addFilter('returnVisitEvent')" />
          <ActionBtn
            icon="custom-index"
            :label="switchTip(state.returnVisitEvent.customizable)"
            class="ltv-btn"
            @click="switchIndex('returnVisitEvent')" />
        </AnalysisIndexItem>
      </div>
      <!-- 初始日期指标(可选) -->
      <AnalysisIndexLabel
        :label="$t('analysis.ltv.initialDateIndicator')"
        class="padding_lr_10"></AnalysisIndexLabel>
      <div :class="['padding_lr_10', state.showInitialDate ? '' : 'mb10']">
        <el-switch
          v-model="state.showInitialDate"
          @change="(val) => switchIndexStatus('initialDate', val)" />
      </div>
      <div
        v-if="state.showInitialDate"
        class="analysis_item eas-block-container">
        <AliasAndDecimal
          class="mb5"
          v-if="state.initialDate.customizable"
          v-model:alias="state.initialDate.alias"
          v-model:round="state.initialDate.round" />
        <AnalysisIndexItem
          index="initialDate"
          :analysisType="5"
          v-model:formula="state.initialDate.code"
          v-model:event-data="state.initialDate.events"
          v-model:event-fields="state.initialDate.eventFields"
          v-model:event-filters="state.initialDate.eventFilters"
          :eventFieldsList="state.initialDate.eventFieldsData"
          :fieldsList="state.initialDate.fieldsList"
          :customizable="state.initialDate.customizable"
          @addFilter="addFilter"
          @deleteFilter="deleteFilter"
          @eventChange="eventChange"
          @customEventChange="customEventChange">
          <ActionBtn
            icon="funnel-filter"
            :label="$t('analysis.addConditions')"
            class="ltv-btn"
            @click="addFilter('initialDate')" />
          <ActionBtn
            icon="custom-index"
            :label="switchTip(state.initialDate.customizable)"
            class="ltv-btn"
            @click="switchIndex('initialDate')" />
        </AnalysisIndexItem>
      </div>
      <!-- 同时展示回访用户参与 -->
      <AnalysisIndexLabel
        :label="$t('analysis.ltv.returnVisitParticipation')"
        class="padding_lr_10"></AnalysisIndexLabel>
      <div class="padding_lr_10 flex-center flex-between">
        <el-switch
          v-model="state.showUserAction"
          @change="(val) => switchIndexStatus('userAction', val)" />
        <el-button
          v-if="state.showUserAction && state.showInitialDate"
          type="primary"
          text
          @click="state.indexCalc = !state.indexCalc">
          {{
            state.indexCalc
              ? $t('analysis.ltv.indicatorCalculation')
              : $t('analysis.ltv.indicatorCalculation')
          }}
        </el-button>
      </div>
      <div
        v-if="state.showUserAction"
        class="analysis_item eas-block-container">
        <template v-if="!state.indexCalc">
          <AliasAndDecimal
            class="mb5"
            v-if="state.userAction.customizable"
            v-model:alias="state.userAction.alias"
            v-model:round="state.userAction.round" />
          <AnalysisIndexItem
            index="userAction"
            :analysisType="6"
            v-model:formula="state.userAction.code"
            v-model:event-data="state.userAction.events"
            v-model:event-fields="state.userAction.eventFields"
            v-model:event-filters="state.userAction.eventFilters"
            :eventFieldsList="state.userAction.eventFieldsData"
            :fieldsList="state.userAction.fieldsList"
            :customizable="state.userAction.customizable"
            @addFilter="addFilter"
            @deleteFilter="deleteFilter"
            @eventChange="eventChange"
            @customEventChange="customEventChange">
            <ActionBtn
              icon="funnel-filter"
              :label="$t('analysis.addConditions')"
              class="ltv-btn"
              @click="addFilter('userAction')" />
            <ActionBtn
              icon="custom-index"
              :label="switchTip(state.userAction.customizable)"
              class="ltv-btn"
              @click="switchIndex('userAction')" />
          </AnalysisIndexItem>
        </template>
        <div v-else class="inde-calc-box">
          <div class="eas-drop-box calc-item mr5" @click="changeCalculateOrder">
            {{ state.calcArr[0].label }}
          </div>
          <decimal-select
            popperClass="symbol-select"
            v-model="state.calcSymbol"
            :list="symbolsArr"
            placement="bottom"></decimal-select>
          <div
            class="eas-drop-box calc-item mg_lr_5"
            @click="changeCalculateOrder">
            {{ state.calcArr[1].label }}
          </div>
          <decimal-select v-model="state.calcRound"></decimal-select>
        </div>
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
        reportType="ltv"
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
.index-area {
  padding: 0px 10px;
}
.padding_lr_10 {
  padding: 0px 10px;
}
.initial_date_btn {
  padding: 10px 0px 16px 10px;
}
.analysis_item {
  margin: 4px 0px 6px 0px;
  padding: 10px;
  &:hover {
    background-color: var(--eas-hover-color);
  }
}
.ltv-btn {
  margin-top: 10px;
  margin-bottom: 0px;
}
.inde-calc-box {
  display: flex;
  align-items: center;
}
.calc-item {
  color: var(--eas-color-primary);
  font-size: var(--eas-font-size-base);
}
.mg_lr_5 {
  margin: 0px 5px;
}
</style>
<style lang="scss">
.symbol-select {
  .decimal-select_list {
    .decimal-select_list__item {
      padding-left: 0;
      width: 40px;
      height: 30px;
      justify-content: center;
    }
  }
}
</style>
