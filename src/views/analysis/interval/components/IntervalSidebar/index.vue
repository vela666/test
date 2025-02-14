<!--
 * **************************************************
 * @file 左边侧边栏组件
 * @author fengsi<294068744@qq.com>
 * @date 2024-02-22 10:11:22
 * **************************************************
-->

<script setup>
import { inject, useAttrs } from 'vue'
import { useIntervalState } from '@/views/analysis/interval/hooks/global-state'
import useSidebarHook from '@/views/analysis/interval/hooks/sidebar-hook'

import {
  AnalysisFooter,
  ActionBtn,
  AnalysisIndexLabel,
} from '@/views/analysis/components/AnalysisSideBar'
import { useI18n } from 'vue-i18n'

defineOptions({
  name: 'IntervalSidebar',
})

const { t } = useI18n() // 使用useI18n钩子获取国际化t函数
const attrs = useAttrs()
const props = defineProps({})
const emits = defineEmits(['clearView'])

const {
  state: intervalState,
  reportInfo,
  handleIntervalAnalyse,
} = inject('intervalState')
const {
  EVENT_ITEMS,
  RELATION_TYPES,
  state,
  events,
  associationField,
  intervalLimit,
  globalFilter,
  groupOption,
  durationChange,
  handleGroupOptionAdd,
  handleGroupOptionRemove,
  handleEventChange,
  getRequestParams,
  handleAddFilter,
  handleRemoveFilter,
  handleFieldChange,
  handleDraftSave,
  handleDraftPadding,
  handleReportOrDraftPadding,
} = useSidebarHook(props, { emits })

defineExpose({
  intervalLimit,
  getRequestParams,
  handleReportOrDraftPadding,
})
</script>

<template>
  <analysis-left>
    <div class="events-container">
      <template v-for="item in EVENT_ITEMS" :key="item.value">
        <AnalysisIndexLabel :label="$t(`analysis.interval.${item.value}`)" />
        <div class="analysis-item eas-block-container">
          <analysis-index-item
            v-model:event-data="events[item.value].event"
            v-model:event-filters="events[item.value].filters"
            :index="item.value"
            :show-event-fields="events[item.value].showEventFields"
            :fields-list="events[item.value].fieldsList"
            @event-change="handleEventChange"
            @add-filter="handleAddFilter"
            @delete-filter="handleRemoveFilter">
            <ActionBtn
              icon="funnel-filter"
              :label="$t('analysis.addConditions')"
              @click="handleAddFilter(item.value)" />
          </analysis-index-item>
        </div>
      </template>

      <AnalysisIndexLabel :label="$t('analysis.interval.relatedAttributes')" />
      <div class="analysis-item eas-block-container">
        <el-switch
          v-model="associationField.enable"
          style="margin-bottom: 5px; height: 20px"></el-switch>

        <template v-if="associationField.enable">
          <el-space class="flex-center">
            <span style="margin-right: 8px">
              {{ $t('analysis.interval.startEventTip') }}
            </span>
            <PropSelect
              v-model="associationField.startEvent.field"
              :list="associationField.startEvent.fieldsList"
              :groups="[]"
              :is-group="true"
              :filterable="true"
              :limit="['eventField']"
              @change="(value) => handleFieldChange('startEvent', value)" />
            <span>
              {{ $t('analysis.interval.startEventTo') }}
            </span>
          </el-space>
          <el-space
            class="flex-center"
            style="margin-top: 5px; flex-wrap: wrap">
            <span>{{ $t('analysis.interval.endEventTip') }}</span>
            <PropSelect
              v-model="associationField.endEvent.field"
              :list="associationField.endEvent.fieldsList"
              :groups="[]"
              :isGroup="true"
              :filterable="true"
              :limit="['eventField']"
              @change="(value) => handleFieldChange('endEvent', value)" />
            <template
              v-if="
                ['int', 'double'].indexOf(
                  associationField.endEvent.field.fType
                ) > -1
              ">
              <span>{{ $t('analysis.interval.comparedToAttribute') }}</span>
              <DropSelectorSingle
                v-model="associationField.endEvent.relation.compareType"
                :data="RELATION_TYPES"
                type="custom"
                width="60">
                <template #default="{ label }">
                  <div class="eas-drop-box">{{ label }}</div>
                </template>
              </DropSelectorSingle>
              <div v-if="associationField.endEvent.relation.compareType !== 1">
                <el-input-number
                  v-model="associationField.endEvent.relation.compareValue"
                  :controls="false"
                  :min="-999999999"
                  :max="999999999"></el-input-number>
              </div>
            </template>
            <span v-else>{{ $t('analysis.interval.endEventTo') }}</span>
          </el-space>
        </template>
      </div>
    </div>

    <analysis-duration
      @change="durationChange"
      v-model="intervalLimit"
      :title="$t('analysis.interval.upperLimit')">
      <template #left>
        <span style="margin-right: 8px">{{
          $t('analysis.interval.upperLimitTips')
        }}</span>
      </template>
      <template #right>
        <Tooltip>
          <SvgIcon name="help2" class="c86919d fz16 ml5" />
          <template #content>
            {{ t('analysis.interval.modifyValueAndRestart') }}
          </template>
        </Tooltip>
      </template>
    </analysis-duration>

    <analysis-global-filter
      v-model="globalFilter.filters"
      :data="globalFilter.fieldsList"
      @add="(filterIndex) => handleAddFilter('globalFilter', filterIndex)"
      @remove="
        (...rest) => handleRemoveFilter('globalFilter', ...rest)
      "></analysis-global-filter>

    <analysis-groups
      v-model="groupOption.fields"
      :data="groupOption.fieldsList"
      :disabled-groups="groupOption.fields"
      :filterable="true"
      @remove="handleGroupOptionRemove">
      <template #btn>
        <el-button
          v-if="groupOption.fields.length < 5"
          type="primary"
          text
          @click="handleGroupOptionAdd">
          <svg-icon name="add-index" class="fz16 mr3"></svg-icon>
          {{ $t('analysis.addGroup') }}
        </el-button>
      </template>
    </analysis-groups>

    <template #footer>
      <AnalysisFooter
        :report-type="intervalState.reportType"
        :chart-type="intervalState.graphType"
        v-model:report-info="reportInfo"
        :loading="state.loading || intervalState.loading"
        :qp="getRequestParams"
        @calcute="handleIntervalAnalyse(getRequestParams())"
        @save-draft="handleDraftSave"
        @padding-draft="handleDraftPadding"
        v-bind="attrs" />
    </template>
  </analysis-left>
</template>

<style scoped lang="scss">
.events-container {
  padding: 0 10px;

  > .analysis-index-label {
    padding: 0 10px;
  }
}
.analysis-item {
  margin: 4px 0 6px 0;
  padding: 10px;

  &:hover {
    background-color: var(--eas-hover-color);

    :deep(.el-input-number) > .el-input > .el-input__wrapper {
      background-color: var(--eas-white-bg-color);
      border-color: var(--eas-border-color);
    }
  }

  .el-button {
    margin-top: 10px;
  }

  //:deep(.eas-prop-select) {
  //  margin-right: 0;
  //}
  :deep(.el-input-number) {
    width: 60px;
    height: 28px;

    &:hover > .el-input > .el-input__wrapper {
      border-color: var(--eas-color-primary);
    }

    > .el-input {
      > .el-input__wrapper {
        padding-right: 10px;
        padding-left: 10px;
        background-color: var(--eas-hover-color-1);
        border-radius: var(--eas-border-radius);
        box-shadow: none;
        border: 1px solid transparent;

        > .el-input__inner {
          text-align: left;
        }
      }
    }
  }
}
</style>
