<template>
  <div class="path-filter" v-if="event.length > 0">
    <div class="nd-and-or-condition"></div>
    <div class="path-filter-content">
      <div
        v-for="(item, i) in event"
        :key="item.id"
        class="mt5 path-filter-content__body">
        <div style="flex: 1">
          <div class="flex-center">
            <DropSelectorSingle
              v-model="event[i].eventName"
              type="custom"
              width="150"
              :data="sourceEventList"
              :defaultProps="{
                value: 'eventName',
                label: 'eventNameZh',
              }"
              :disabledData="disabledEventList"
              placement="bottom-start"
              @change="(val) => eventChange(val, i)">
              <template #default="{ label }">
                <div
                  :class="[
                    'eas-drop-box',
                    { 'no-permission': event[i]?.permissionStatus === false },
                  ]">
                  {{ label ?? event[i]?.eventNameDisplay }}
                </div>
              </template>
            </DropSelectorSingle>

            <!-- 事件拆分 -->
            <template v-if="item.split">
              <span class="ml8 mr8">{{ $t('analysis.path.by') }}</span>
              <PropSelect
                :list="item.eventFieldsData"
                v-model="item.fields"
                :isGroup="true"
                :limit="['eventField']" />

              <GroupTimeSummary
                v-if="['timestamp', 'datetime'].includes(item.fields.fType)"
                v-model="item.fields.timeType" />
              <GroupRange
                v-if="['int', 'double'].includes(item.fields.fType)"
                v-model="item.fields.range"
                :group="item.fields" />
            </template>
            <template v-if="!item.split && item.filters.length === 0">
              <span class="cff9f24 ml8">{{
                $t('analysis.path.addConditionsOrEventSplit')
              }}</span>
            </template>
          </div>

          <PropsFilter
            v-if="item.filters?.length > 0"
            :data="item.eventFieldsData"
            v-model="event[i]"
            :limit="['eventField']"
            @add="(fIndex) => addEventFilter(i, fIndex)"
            @remove="
              (fIndex, subfIndex) => removeEventFilter(i, fIndex, subfIndex)
            " />

          <div class="mt10">
            <ActionBtn
              icon="funnel-filter"
              :label="$t('analysis.addConditions')"
              @click="addEventFilter(i)" />
            <ActionBtn
              icon="event-split"
              :label="
                item.split
                  ? $t('analysis.path.cancelEventSplitting')
                  : $t('analysis.path.eventSplit')
              "
              @click="eventSplit(i)" />
          </div>
        </div>
        <ActionBtn
          :content="$t('analysis.path.deleteEvent')"
          icon="delete2"
          @click="removeEventField(i)"
          type="icon" />
      </div>
    </div>
  </div>
  <div class="mt10">
    <ActionBtn
      icon="funnel-filter"
      :label="$t('analysis.path.addEventFilterOrSplit')"
      @click="addEventField" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ActionBtn } from '@/views/analysis/components/AnalysisSideBar'
import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import { getTableType } from '@/utils/dataProcessing'
import useOperate from '@/components/PropsFilter/useOperate'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { cloneDeep } from 'lodash-es'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'PathAnalysisEvent',
})

const props = defineProps({
  sourceEvent: {
    type: Object,
    default: () => {},
  },
})

const { fetchFieldList } = useAanlysisUtils()
const { handleDelConditionData, handleAddConditionData, omitFiltersHandler } =
  useOperate()

const sourceEventList = ref([])
const event = defineModel()
const watchFlag = defineModel('watchFlag', { type: Boolean, default: true })

const disabledEventList = computed(() => {
  const eventName = event.value.map((item) => item.eventName)

  return [...new Set(eventName), props.sourceEvent.eventName]
})

const initEventField = (val) => {
  sourceEventList.value = val

  event.value = event.value.filter((item) => val.includes(item.eventName))
}

watch(
  () => props.sourceEvent.eventName,
  (val) => {
    if (val) {
      if (watchFlag.value) {
        omitEventFilters(val)
      } else {
        watchFlag.value = true
      }
    }
  },
  {
    immediate: true,
  }
)

/**
 * @description: 若模块【添加事件筛选/拆分】中展示了B事件，且此时分析路径改变以B为初始事件/结束事件，则模块【添加事件筛选/拆分】中已展示的B事件需自动删除
 * @return {*}
 */
function omitEventFilters(val) {
  const index = event.value.findIndex((item) => item.eventName === val)
  if (index >= 0) {
    event.value.splice(index, 1)
  }
}

/**
 * @description: 添加事件筛选/拆分
 * @return {*}
 */
const addEventField = async () => {
  const eventInfo = sourceEventList.value.find(
    (item) => !disabledEventList.value.includes(item.eventName)
  )
  if (sourceEventList.value.length === 0 || !eventInfo) {
    ElMessage.warning(t('analysis.path.eventEmpty'))
    return
  }

  const { eventName, eventNameZh } = eventInfo

  const eventId = sourceEventList.value.find(
    (item) => item.eventName === eventName
  )?.eventId

  const res = await fetchFieldList(eventId)

  event.value.push({
    id: uuidv4(),
    eventName,
    eventFieldsData: cloneDeep(res),
    filters: [],
    relation: 0,
  })
}

/**
 * @description: 删除事件
 * @return {*}
 * @param {*} i
 */
const removeEventField = (i) => {
  event.value.splice(i, 1)
}

/**
 * @description: 改变事件
 * @return {*}
 */
const eventChange = async (val, i) => {
  if (event.value[i].eventName === val) return
  const eventId = sourceEventList.value.find(
    (item) => item.eventName === val
  )?.eventId
  const res = await fetchFieldList(eventId)
  Reflect.deleteProperty(event.value[i], 'permissionStatus')
  Reflect.deleteProperty(event.value[i], 'eventNameDisplay')
  event.value[i].eventFieldsData = cloneDeep(res)
  const newFilters = omitFiltersHandler(res, event.value[i].filters)
  event.value[i].filters = newFilters
}

/**
 * @description: 事件拆分、取消事件拆分
 * @return {*}
 */
const eventSplit = (i) => {
  const split = !event.value[i].split
  event.value[i].split = split

  if (split) {
    event.value[i] = {
      ...event.value[i],
      fields: {
        timeType: '',
        range: {
          propertyRange: [],
          propertyRangeType: 1,
        },
        ...getFirstAttr(event.value[i].eventFieldsData['eventField']),
      },
    }
  } else {
    event.value[i] = {
      ...event.value[i],
      fields: {},
    }
  }
}

/**
 * @description: 添加条件
 * @return {*}
 */
const addEventFilter = (i, index) => {
  event.value[i] = handleAddConditionData({
    condition: event.value[i],
    conditionList: event.value[i].eventFieldsData,
    index,
  })
}

/**
 * @description: 删除条件
 * @return {*}
 */
const removeEventFilter = (i, index, subIndex) => {
  event.value[i] = handleDelConditionData({
    condition: event.value[i],
    index,
    subIndex,
  })
}

/**
 * @description: 获取事件属性
 * @return {*}
 */
const getFirstAttr = (fieldData) => {
  let attr = {}
  if (Array.isArray(fieldData)) {
    for (const item of fieldData) {
      attr = {
        fEn: item.fEn,
        name: item.fZh,
        fType: item.fType,
        parentId: item.fieldId,
        tableType: getTableType('eventField', item),
      }
      break
    }
  }
  return attr
}

defineExpose({
  initEventField,
})
</script>

<style scoped lang="scss">
.path-filter {
  margin-top: 10px;
  display: flex;
}

:deep() {
  .path-filter-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    &__body {
      display: flex;
      &:hover {
        .analysis-icon__btn {
          visibility: visible;
        }
      }
    }
    .analysis-icon__btn {
      visibility: hidden;
      position: relative;
      top: 2px;
    }
  }
}

.nd-and-or-condition {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 24px;
  margin-right: 15px;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 100%;
    background-color: #d9dfe6;
  }
}
</style>
