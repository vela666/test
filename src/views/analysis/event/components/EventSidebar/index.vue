<script setup>
defineOptions({
  name: 'EventSidebar',
})
import { ref, watch, nextTick, useAttrs } from 'vue'
import draggable from 'vuedraggable'
import EventSplit from '../EventSplit/index.vue'
import useEventSidebar from './hooks/useEventSidebar'
import { AnalysisFooter } from '@/views/analysis/components/AnalysisSideBar'
const emits = defineEmits(['analysis', 'clearView'])

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
  parentState: {
    type: Object,
    default: () => ({}),
  },
})

const {
  analysisList,
  state,
  splitEventSource,
  eventChange,
  addFilter,
  deleteFilter,
  addIndex,
  addCustomIndex,
  deleteIndex,
  copyIndex,
  addGlobalFilter,
  deleteGlobalFilter,
  addGroupItem,
  removeGroupItem,
  addSplitEvent,
  disabledGroups,
  groupFieldsData,
  showSplitBtn,
  editAlias,
  startAnalysis,
  customEventChange,
  getRequestParams,
  echoReportAndDraft,
  initBeforeGetEvents,
  showEventSplitAdd,
  AnalysisIndexRef,
} = useEventSidebar(emits, props)

const leftLoding = ref(false)

/**
 * @description: 保存草稿
 * @return {*}
 */
const saveDraft = (cb) => {
  const params = getRequestParams()
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
defineExpose({ startAnalysis })
</script>

<template>
  <analysis-left :loading="leftLoding">
    <div class="data-analysis-index">
      <draggable
        v-model="analysisList"
        force-fallback="true"
        :group="{ name: 'rules', pull: false, put: false }"
        :animation="500"
        handle=".tag-drag"
        fallback-tolerance="10"
        item-key="id"
        :component-data="{
          name: 'fade',
          type: 'transtion-group',
        }">
        <template #item="{ element, index }">
          <div class="data-analysis-index__item eas-block-container">
            <div class="index-header mb5">
              <div class="index-left">
                <div class="tag-num mr20">{{ index + 1 }}</div>
                <div class="tag-drag mr20">
                  <svg-icon name="drag-icon"></svg-icon>
                </div>
                <div class="index-name mr5">
                  <template v-if="element.aliasEdited">
                    <CommonInput
                      v-model="element.alias"
                      :maxlength="25"
                      :desc="$t('analysis.indicatorsPlaceholder')"
                      :prefixSlot="false"
                      :clearable="false"
                      class="alias-input" />
                    <decimal-select
                      v-if="element.customizable"
                      v-model="element.round"></decimal-select>
                  </template>
                  <template v-else>
                    {{ element?.events?.eventNameZh ?? '' }}
                    {{
                      element?.eventFields?.analysisDesc
                        ? `.${element?.eventFields?.propertyNameDisplay ?? ''}${
                            element?.eventFields?.analysisDesc ?? ''
                          }`
                        : ''
                    }}
                  </template>
                </div>
                <el-tooltip
                  :content="$t('analysis.editIndicatorName')"
                  placement="top"
                  :hide-after="0"
                  v-if="!element.aliasEdited">
                  <div
                    class="analysis-icon__btn analysis-item-btn"
                    @click="editAlias(index)">
                    <svg-icon name="edit1"></svg-icon>
                  </div>
                </el-tooltip>
              </div>
              <div class="index-right">
                <!-- <el-tooltip content="指标模板" placement="top">
                    <div class="analysis-icon__btn analysis-item-btn">
                      <svg-icon name="index-template"></svg-icon>
                    </div>
                  </el-tooltip> -->
                <el-tooltip
                  :content="$t('analysis.copyIndicators')"
                  placement="top"
                  :hide-after="0"
                  v-if="analysisList.length < 20">
                  <div
                    class="analysis-icon__btn analysis-item-btn"
                    @click="copyIndex(index)">
                    <svg-icon name="copy-index"></svg-icon>
                  </div>
                </el-tooltip>
                <el-tooltip
                  :content="$t('analysis.deleteIndicators')"
                  placement="top"
                  :hide-after="0"
                  v-if="analysisList.length > 1">
                  <div
                    class="analysis-icon__btn analysis-item-btn"
                    @click="deleteIndex(index)">
                    <svg-icon name="delete2"></svg-icon>
                  </div>
                </el-tooltip>
                <el-tooltip
                  :content="$t('btn.more')"
                  placement="top"
                  :hide-after="0"
                  v-if="false">
                  <div class="analysis-icon__btn analysis-item-btn">
                    <svg-icon name="more"></svg-icon>
                  </div>
                </el-tooltip>
              </div>
            </div>
            <AnalysisIndexItem
              v-model:formula="element.code"
              v-model:event-data="element.events"
              v-model:event-fields="element.eventFields"
              v-model:event-filters="element.eventFilters"
              :eventFieldsList="element.eventFieldsData"
              :fieldsList="element.fieldsList"
              :customizable="element.customizable"
              :index="index"
              :splitEvents="state.splitEvents"
              @customEventChange="customEventChange"
              @eventChange="eventChange"
              @addFilter="addFilter"
              @deleteFilter="deleteFilter"
              anyEvent
              :ref="(ref) => (AnalysisIndexRef[index] = ref)">
              <template #split>
                <SplitBtn
                  v-if="showSplitBtn(element, index)"
                  v-model="element.hasEventSplit" />
              </template>
            </AnalysisIndexItem>
          </div>
        </template>
      </draggable>
      <div class="data-analysis-index__add" v-if="analysisList.length < 20">
        <el-button type="primary" text @click="addIndex">
          <svg-icon name="add-index" class="fz16 mr3"></svg-icon>
          {{ $t('analysis.addIndicators') }}
        </el-button>
        <el-button type="primary" text @click="addCustomIndex">
          <svg-icon name="custom-index" class="fz16 mr3"></svg-icon>
          {{ $t('analysis.addCustomIndicators') }}
        </el-button>
      </div>
    </div>
    <AnalysisGlobalFilter
      v-model="state.globalFilters"
      :data="state.globalFiledsData"
      @add="addGlobalFilter"
      @remove="deleteGlobalFilter" />
    <analysis-groups
      v-model="state.groupList"
      :data="groupFieldsData"
      :disabledGroups="disabledGroups"
      @remove="(val) => removeGroupItem(val)">
      <template #split>
        <div
          class="analysis-group-container eas-block-container"
          v-if="state.splitEvents.length > 0">
          <EventSplit
            :sourceEvents="splitEventSource"
            :groups="state.groupList"
            v-model="state.splitEvents" />
        </div>
      </template>
      <template #btn>
        <el-button
          type="primary"
          text
          @click="addGroupItem"
          v-if="state.groupList.length < 5">
          <svg-icon name="add-index" class="fz16 mr3"></svg-icon>
          {{ $t('analysis.addGroup') }}
        </el-button>
        <el-button
          type="primary"
          text
          v-if="showEventSplitAdd"
          @click="addSplitEvent">
          <svg-icon name="event-split" class="fz16 mr3"></svg-icon>
          {{ $t('analysis.event.eventSplit') }}
        </el-button>
      </template>
    </analysis-groups>
    <template #footer>
      <AnalysisFooter
        reportType="event"
        :chartType="parentState.graphType"
        :loading="loading"
        :qp="getRequestParams"
        :reportInfo="reportInfo"
        @calcute="startAnalysis"
        @saveDraft="saveDraft"
        @paddingDraft="paddingDraft"
        v-bind="attrs" />
    </template>
  </analysis-left>
</template>

<style scoped lang="scss">
.flex-center {
  display: flex;
  align-items: center;
}
.flex-center-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.data-analysis-index {
  width: calc(100% - 20px);
  margin: 0px 10px;
}
.data-analysis-index__item {
  width: 100%;
  min-height: 108px;
  padding: 10px;
  color: var(--eas-text-color-primary);
  &:hover {
    background-color: var(--eas-hover-color);
    border-radius: var(--eas-border-radius-4);
    .tag-num {
      display: none;
    }
    .tag-drag {
      display: inherit;
      cursor: grab;
    }
    .analysis-item-btn {
      visibility: inherit;
    }
  }
}
.index-name {
  display: inline-flex;
}
.analysis-item-btn {
  visibility: hidden;
}
.data-analysis-index__add {
  padding-left: 19px;
  margin: 10px 0px;
}
.index-header {
  @extend .flex-center;
  justify-content: space-between;
}
.index-left {
  @extend .flex-center-center;
}
.index-right {
  @extend .flex-center-center;
}

.index-body {
  padding-left: 40px;
}
.word__de {
  display: inline-block;
  line-height: 28px;
  vertical-align: top;
}
.section-label {
  width: 100%;
  height: 64px;
  line-height: 64px;
  padding-left: 20px;
  font-size: var(--eas-font-size-medium);
  color: var(--eas-text-color-primary);
  font-weight: bold;
}
</style>
