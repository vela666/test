<script setup>
import { cloneDeep, isEqual, remove } from 'lodash-es'
import { ref, computed, watch, nextTick } from 'vue'
import { getTableType } from '@/utils/dataProcessing'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
const { fetchFieldList } = useAanlysisUtils()
defineOptions({
  name: 'EventSplit',
})
const emit = defineEmits(['update:modelValue', 'change'])

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
    require: true,
  },
  sourceEvents: {
    type: Array,
    default: () => [],
    required: true,
  },
  groups: {
    type: Array,
    default: () => [],
    required: true,
  },
})

const splitValue = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const omitAttr = ['__fid', '__bid', '__did']

const watchSourceEvents = ref([])

const addWatchSourceEvent = async (data = []) => {
  // 添加新增的事件
  const eventNamesArr = []
  for (const item of data) {
    eventNamesArr.push(item.eventName)
    const find = watchSourceEvents.value.find(
      (el) => el?.eventName === item.eventName
    )
    const fieldData = item.fieldsList?.eventField
    if (find === undefined) {
      if (Array.isArray(fieldData)) {
        watchSourceEvents.value.push({ ...item })
      } else {
        const res = await fetchFieldList(item.eventId)
        watchSourceEvents.value.push({ ...item, fieldsList: cloneDeep(res) })
      }
    }
  }
  return eventNamesArr
}

watch(
  () => props.sourceEvents,
  async (newVal) => {
    const eventNamesArr = await addWatchSourceEvent(newVal)
    // 移除已经删除的
    remove(
      watchSourceEvents.value,
      (el) => !eventNamesArr.includes(el?.eventName)
    )
    // 指标事件改变，删除指标事件中不存在的事件的拆分项
    remove(
      splitValue.value,
      (el) => !eventNamesArr.includes(el?.events?.eventName)
    )
  },
  { immediate: true }
)

const isDisabledAdd = () =>
  splitValue.value.length === props.sourceEvents.length ||
  splitValue.value.length >= 3

const addSplitItem = () => {
  if (isDisabledAdd()) return
  // 增加事件拆分
  for (const item of watchSourceEvents.value) {
    const find = splitValue.value.find(
      (el) => el?.events?.eventName === item.eventName
    )
    const fieldData = item.fieldsList?.eventField
    if (find === undefined && Array.isArray(fieldData)) {
      const data = fieldData.filter((el) => !omitAttr.includes(el.fEn))
      let temp = {
        events: {
          eventName: item.eventName,
          eventNameZh: item.eventNameZh,
          eventType: item.eventType,
        },
        attr: { ...getFirstAttr(data) },
        timeType: '',
        range: {
          propertyRange: [],
          propertyRangeType: 1,
        },
      }
      splitValue.value.push(temp)
      return
    }
  }
}

const getFirstAttr = (fieldData) => {
  let attr = {}
  if (Array.isArray(fieldData)) {
    for (const item of fieldData) {
      const fItem = props.groups.find((el) => item.fEn === el.fEn)
      if (fItem === undefined) {
        attr = {
          fEn: item.fEn,
          fZh: item.fZh,
          fType: item.fType,
          parentId: item.fieldId,
          tableType: getTableType('eventField', item),
        }
        break
      }
    }
  }
  return attr
}

const initTimeType = (fType, index) => {
  if (['timestamp', 'datetime'].includes(fType)) {
    nextTick(() => {
      splitValue.value[index].timeType = 'day'
    })
  }
}

const changeEvent = (cnd, index) => {
  if (cnd.eventName === splitValue.value?.[index]?.events?.eventName) return
  splitValue.value[index].events = {
    eventName: cnd.eventName,
    eventNameZh: cnd.eventNameZh,
    eventType: cnd.eventType,
  }
  let attr = {}
  const find = watchSourceEvents.value.find(
    (el) => el.eventName === cnd.eventName
  )
  const fieldData = find?.fieldsList?.eventField
  if (find !== undefined && Array.isArray(fieldData)) {
    const data = fieldData.filter((el) => !omitAttr.includes(el.fEn))
    const hasOld = data.find(
      (el) => el.fEn === splitValue.value?.[index]?.attr?.fEn
    )
    if (hasOld !== undefined) {
      initTimeType(splitValue.value?.[index]?.attr?.fType, index)
      return
    }
    attr = getFirstAttr(data)
  }
  splitValue.value[index].attr = attr
  initTimeType(attr?.fType, index)
}

const isDisabledItem = (item, cur) => {
  return (
    splitValue.value.find(
      (el) =>
        item.eventName === el.events?.eventName &&
        item.eventName !== cur?.events?.eventName
    ) !== undefined
  )
}
const isCurrentItem = (item, cur) => {
  return item.eventName === cur?.events?.eventName
}

const getEventFields = (eventName) => {
  let res = {}
  if (eventName) {
    const find = watchSourceEvents.value.find(
      (el) => el.eventName === eventName
    )
    if (find !== undefined && find.fieldsList) {
      res = cloneDeep(find.fieldsList)
    }
  }
  return res
}

const removeSplitItem = (index) => {
  splitValue.value.splice(index, 1)
}
</script>

<template>
  <div class="event-split">
    <div>
      <div
        class="event-split__item"
        v-for="(data, index) in splitValue"
        :key="`event-split-item__${data.events.eventName}`">
        <el-dropdown
          trigger="click"
          popper-class="event-split__dropdown"
          placement="bottom-start"
          @command="(cnd) => changeEvent(cnd, index)">
          <div class="eas-drop-box">
            {{ data.events?.eventNameZh }}
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in sourceEvents"
                :command="item"
                :key="`event-split-item-event__${item.eventId}`"
                :class="[{ 'is-active': isCurrentItem(item, data) }]"
                :disabled="isDisabledItem(item, data)">
                {{ item.eventNameZh }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span class="word__esplit">{{ $t('analysis.event.by') }}</span>
        <PropSelect
          :list="getEventFields(data?.events?.eventName)"
          v-model="data.attr"
          :groups="groups"
          :limit="['eventField']"
          :isGroup="true" />
        <GroupTimeSummary
          v-if="['timestamp', 'datetime'].includes(data.attr.fType)"
          v-model="data.timeType" />
        <GroupRange
          v-if="['int', 'double'].includes(data.attr.fType)"
          v-model="data.range"
          :group="data.attr" />
        <span class="word__esplit">{{ $t('analysis.event.split') }}</span>
        <el-tooltip
          :content="$t('analysis.event.deleteSplitItem')"
          placement="top"
          :enterable="false">
          <div class="split-event-btn" @click="removeSplitItem(index)">
            <svg-icon name="delete2"></svg-icon>
          </div>
        </el-tooltip>
      </div>
    </div>
    <el-button
      type="primary"
      text
      @click="addSplitItem"
      style="padding: 0px"
      :disabled="isDisabledAdd()">
      <svg-icon name="add-index" class="fz16 mr3"></svg-icon>
      {{ $t('analysis.event.addSplitItem') }}
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.event-split {
  width: 100%;
  padding: 10px;
  &:hover {
    background-color: var(--eas-hover-color);
  }
  &__item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    &:hover {
      .split-event-btn {
        visibility: inherit;
      }
    }
  }
}
.word__esplit {
  display: inline-block;
  line-height: 28px;
  padding: 0px 8px;
  color: var(--eas-text-color-primary);
}

.split-event-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--eas-text-color-light);
  visibility: hidden;
  cursor: pointer;
  &:hover {
    color: var(--eas-color-primary);
    background: var(--eas-split-line-color);
  }
}
</style>
<style lang="scss">
.el-dropdown__popper.event-split__dropdown {
  margin-top: -6px;
  .el-dropdown-menu {
    padding: 4px;
  }
  .el-popper__arrow {
    display: none;
  }
  .el-dropdown-menu__item {
    &.is-active {
      background-color: var(--eas-color-primary-light-1);
      color: var(--eas-color-primary);
    }
  }
}
</style>
