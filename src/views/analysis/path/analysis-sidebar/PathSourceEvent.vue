<template>
  <div class="analysis_item eas-block-container analysis-hover__bg">
    <div class="flex-center">
      <DropSelectorSingle
        v-model="sourceEvent"
        type="custom"
        width="150"
        :data="sourceEventList"
        :defaultProps="{
          value: 'eventName',
          label: 'eventNameZh',
        }"
        value-key
        placement="bottom-start">
        <template #default="{ label }">
          <div
            :class="[
              'eas-drop-box',
              { 'no-permission': sourceEvent?.permissionStatus === false },
            ]">
            {{ label ?? sourceEvent?.eventNameDisplay }}
          </div>
        </template>
      </DropSelectorSingle>

      <span class="ml8 mr8">{{ $t('analysis.path.is') }}</span>

      <DropSelectorSingle
        v-model="sourceEvent.sourceType"
        type="custom"
        :data="staticList"
        placement="bottom-start">
        <template #default="{ label }">
          <div class="eas-drop-box">{{ label }}</div>
        </template>
      </DropSelectorSingle>
    </div>
    <PropsFilter
      v-if="sourceEvent.filters.length > 0"
      :data="sourceEventFieldsData"
      v-model="sourceEvent"
      :limit="['eventField']"
      @add="(fIndex) => addEventFilter(fIndex)"
      @remove="(fIndex, subfIndex) => removeEventFilter(fIndex, subfIndex)" />

    <div class="mt10">
      <ActionBtn
        icon="funnel-filter"
        :label="$t('analysis.addConditions')"
        @click="addEventFilter" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ActionBtn } from '@/views/analysis/components/AnalysisSideBar'
import useOperate from '@/components/PropsFilter/useOperate'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { ElMessage } from 'element-plus'
import { JsonView } from 'vue-json-viewer'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'PathSourceEvent',
})

const { fetchFieldList } = useAanlysisUtils()
const { handleDelConditionData, handleAddConditionData, omitFiltersHandler } =
  useOperate()

const staticList = [
  {
    value: '0',
    label: t('analysis.path.startEvent'),
  },
  {
    value: '1',
    label: t('analysis.path.endEvent'),
  },
]

const sourceEvent = defineModel()
const sourceEventList = ref([])
const sourceEventFieldsData = ref([])
const watchFlag = defineModel('watchFlag', { type: Boolean, default: true })
/**
 * @description: 分析路径以
 * @return {*}
 * @param {*} val
 */
const initSourceEvent = (val, flag) => {
  sourceEventList.value = val
  if (val.length === 0 || flag === false) {
    sourceEventFieldsData.value = []
    return
  }

  if (
    !sourceEvent.value.eventName ||
    sourceEventList.value.every(
      (item) => item.eventName !== sourceEvent.value.eventName
    )
  ) {
    const { eventName, eventNameZh, eventType } = sourceEventList.value[0]
    sourceEvent.value.eventName = eventName
    sourceEvent.value.eventNameZh = eventNameZh
    sourceEvent.value.eventType = eventType
  }
}

watch(
  () => sourceEvent.value.eventName,
  async (val) => {
    if (!val) return
    const eventId = sourceEventList.value.find(
      (item) => item.eventName === val
    )?.eventId
    const res = await fetchFieldList(eventId)
    sourceEventFieldsData.value = res
    if (watchFlag.value) {
      const newFilters = omitFiltersHandler(res, sourceEvent.value.filters)
      sourceEvent.value.filters = newFilters
      Reflect.deleteProperty(sourceEvent.value, 'permissionStatus')
      Reflect.deleteProperty(sourceEvent.value, 'eventNameDisplay')
    } else {
      watchFlag.value = true
    }
  }
)

/**
 * @description: 添加条件
 * @return {*}
 */
const addEventFilter = (index) => {
  sourceEvent.value = handleAddConditionData({
    condition: sourceEvent.value,
    conditionList: sourceEventFieldsData.value,
    index,
  })
}

/**
 * @description: 删除条件
 * @return {*}
 */
const removeEventFilter = (index, subIndex) => {
  sourceEvent.value = handleDelConditionData({
    condition: sourceEvent.value,
    index,
    subIndex,
  })
}

defineExpose({
  initSourceEvent,
})
</script>

<style lang="scss" scoped>
.analysis_item {
  margin: 4px 10px 0px;
  padding: 10px;
}
</style>
