<template>
  <el-form-item :label="$t('user.analysisPeriod')" prop="name">
    <DateRangeSelect
      :dateTextOnly="disabled"
      placement="left"
      v-model="state.dateRange" />
  </el-form-item>

  <el-form-item :label="$t('user.userComplete')" prop="name">
    <div class="nd-condition">
      <div
        :class="[
          disabled ? 'nd-condition-disabled' : '',
          'nd-condition-content',
          'skip',
        ]">
        <div class="w100-percentage">
          <div class="nd-condition-content-list flex-column w100-percentage">
            <!-- 事件 -->
            <div>
              <div class="flex">
                <div class="flex-column gap5 w100-percentage">
                  <div class="nd-event-list">
                    <div>
                      <el-select
                        v-model="state.group.isFirst"
                        filterable
                        class="h28 w140 nd-first-last">
                        <el-option :label="$t('user.first')" :value="1" />
                        <el-option :label="$t('user.theLast')" :value="0" />
                      </el-select>

                      <IndexSelect
                        @change="(val) => indexSelectChange(val)"
                        v-model="state.group.indexSelectData"
                        class="m0" />
                      <span>{{ $t('common.of') }}</span>
                      <el-select
                        v-model="state.group.propertyNameDisplay"
                        filterable
                        :style="`width:${
                          getActualWidthOfChars(
                            state.group.propertyNameDisplay + ''
                          ) + 60
                        }px`"
                        @change="propertyChange"
                        :class="{
                          'nd-no-permission': !state.group.propertyStatus,
                        }"
                        class="nd-first-last skip">
                        <el-option
                          v-for="item of state.propertyList"
                          :key="item"
                          :label="item.fZh"
                          :value="item.fZh" />
                      </el-select>
                    </div>

                    <!-- 事件子项 -->
                    <PropsFilter
                      v-if="state.group.condition?.filters?.length"
                      :limit="['eventField', 'userField']"
                      :data="state.group.propsFilterData"
                      v-model="state.group.condition"
                      @add="
                        (filterIndex, filterSubIndex) =>
                          addSubEventFilter(
                            state.group,
                            filterIndex,
                            filterSubIndex
                          )
                      "
                      @remove="
                        (filterIndex, filterSubIndex) =>
                          handleDelRow(filterIndex, filterSubIndex)
                      " />

                    <el-button
                      v-if="!disabled"
                      class="nd-condition-content-add"
                      text
                      @click="addSubEventFilter(state.group)">
                      <SvgIcon name="add1" />
                      {{ $t('common.addConditions') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-form-item>
</template>

<script setup>
import { markRaw, reactive, watch } from 'vue'

import { past7DayRange } from '@/enumeration/date'
import useReq from './useReq'
import useEventStore from '@/store/modules/event'
import useOperate from '@/components/PropsFilter/useOperate'
import { isBoolean } from '@/utils/types'
import { ElMessage } from 'element-plus'
import { getActualWidthOfChars } from '@/utils/index.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const {
  parseFilterData,
  parseFiltersFromRes,
  handleDelConditionData,
  handleAddConditionData,
} = useOperate()

const props = defineProps({
  qp: {
    type: Object,
    default() {
      return {}
    },
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})
const { asyncGetFieldList, asyncGetFieldStatus } = useReq()
// 对应1.0 eventInfo接口的数据
const eventStore = useEventStore()
const initVal = () => {
  const defaultConditions = {
    // filterType 的意义 0是没嵌套 1是嵌套
    /*    {
relation: 1,
filters: [
  {
    filterType: 1,
    relation: 0,
    filters: [],
  },
  {
    filterType: 0,
    ...
  },
],
}*/
    relation: 0,
    filters: [],
  }
  return {
    propertyList: [],
    group: {
      propertyStatus: true,
    },
    dateRange: {
      ...past7DayRange,
      shortcutType: 'past7Day',
    },
    defaultConditions,
  }
}

const state = reactive(initVal())

// 选择事件 templateEvent
const indexSelectChange = async (changeVal) => {
  // 清空事件查询筛选项
  state.group.condition = initVal().defaultConditions
  const { filedData, cloneFiledData } = await asyncGetFieldList(
    changeVal.eventId
  )
  state.propertyList = markRaw(filedData.eventField)
  state.group.propertyName = state.propertyList[0].fEn
  state.group.propertyType = state.propertyList[0].fType
  state.group.propertyNameDisplay = state.propertyList[0].fZh
  state.group.propsFilterData = cloneFiledData
  state.group.propertyStatus = true
}

const propertyChange = async (value) => {
  const data = state.propertyList.find((item) => item.fZh === value)
  state.group.propertyName = data.fEn
  state.group.propertyType = data.fType
  state.group.parentId = data.fieldId
  state.group.propertyStatus = data.permissionStatus
  // state.group.propertyNameDisplay = data.fZh
}

// 添加事件子项筛选 addScreen
const addSubEventFilter = async (item, filterIndex, filterSubIndex) => {
  item.condition = handleAddConditionData({
    condition: item.condition,
    noLimit: ['eventField', 'userField'],
    conditionList: item.propsFilterData,
    index: filterIndex,
  })
}

// 删除行
const handleDelRow = (index, subIndex) => {
  state.group.condition = handleDelConditionData({
    condition: state.group.condition,
    index,
    subIndex,
  })
}

// 处理标签数据
const mapTagData = async (item) => {
  // 事件
  const event = eventStore.currentEventList.find(
    (e) => e.eventName === item.eventName
  )
  const fieldMap = new Map()
  let eventId = event ? event.eventId : 0
  let propertyNameDisplay = ''
  let eventNameZh = ''
  let eventFieldResult = {}
  // 没找到事件
  if (!event) {
    const eventRes = await asyncGetFieldStatus({
      field: item.eventName,
      type: 0,
    })
    if (eventRes?.length > 0) {
      eventId = eventRes[0].dataId
      eventNameZh = eventRes[0].fieldDisplayName
    }
  } else {
    const { filedData } = await asyncGetFieldList(eventId)
    eventFieldResult = filedData
    filedData.eventField.forEach((item) => fieldMap.set(item.fEn, item))
  }

  // 没找到事件属性 可能改名/删除
  if (
    item.propertyName &&
    !fieldMap.get(item.propertyName) &&
    item.propertyName !== '__pt_date'
  ) {
    const propsRes = await asyncGetFieldStatus({
      field: item.propertyName,
      type: 1,
    })
    if (propsRes?.length) {
      propertyNameDisplay = propsRes[0].fieldDisplayName
    }
  }
  let property = {}
  // 拿最新的事件属性名
  if (item.propertyName && eventFieldResult.eventField) {
    property =
      eventFieldResult.eventField.find((e) => e.fEn === item.propertyName) || {}
  }
  state.propertyList = markRaw(eventFieldResult.eventField || [])

  const newItem = {
    relation: item.relation,
    isFirst: item.isFirst,
    indexSelectData: {
      eventId,
      eventNameZh: eventNameZh || event?.eventNameZh || item.eventNameDisplay,
      eventName: event?.eventName || item.eventName,
      // false异常 无权限/隐藏时处理
      // permissionStatus,
    },
    propertyName: property.fEn || item.propertyName,
    propertyType: property.fType || item.propertyType,
    propertyNameDisplay:
      propertyNameDisplay ||
      fieldMap.get(item.propertyName)?.fZh ||
      item.propertyNameDisplay,
    parentId: item.parentId,
    propertyStatus:
      fieldMap.get(item.propertyName)?.permissionStatus ??
      property.permissionStatus,
    condition: initVal().defaultConditions,
  }

  // 新参数里会存在shortcutType
  if (!Reflect.has(item, 'shortcutType') && item.recentDay) {
    const [start, end] = item.recentDay.replace(/-/g, '').split(',')
    state.dateRange.diff = `${end}-${start}`
  }
  state.dateRange.date = [item.startTime, item.endTime]

  if (item.allDateParams) {
    state.dateRange = item.allDateParams
  } else {
    state.dateRange.shortcutType = ''
  }

  const { cloneFiledData } = await asyncGetFieldList(eventId)

  newItem.propsFilterData = cloneFiledData
  if (item.filts?.length) {
    newItem.condition = parseFiltersFromRes(item)
  }
  state.group = newItem
}

// 标签时 type传值
const getResult = () => {
  return new Promise((resolve, reject) => {
    if (!state.group.indexSelectData) {
      reject(t('user.userCompletionNoEmpty'))
      return
    }
    // 事件
    const eventObj = {
      isFirst: state.group.isFirst,
      eventNameDisplay: state.group.indexSelectData?.eventNameZh,
      eventName: state.group.indexSelectData?.eventName,
      relation: state.group.relation,
      propertyType: state.group.propertyType,
      allDateParams: state.dateRange,
      shortcutType: state.dateRange.shortcutType,
      startTime: state.dateRange.date[0],
      endTime: state.dateRange.date[1],
      propertyName: state.group.propertyName,
      propertyNameDisplay: state.group.propertyNameDisplay,
      // 选择的是维度有值
      parentId: state.group.parentId,
    }
    const recentDay = state.dateRange.diff.split('-')
    if (recentDay.length === 2) {
      eventObj.recentDay = `${recentDay[1] ? `-${recentDay[1]}` : ''},-${recentDay[0]}`
    }

    if (state.group.condition?.filters?.length) {
      const event = parseFilterData(state.group.condition)
      if (isBoolean(event)) {
        reject(t('common.filterConditionErr'))
        return
      } else {
        eventObj.filts = event.filts
        eventObj.relation = event.relation
      }
    }

    resolve(eventObj)
  })
}

const initData = async () => {
  const firstEvnet = eventStore.currentEventList.find(
    (i) => i.permissionStatus !== false
  )
  if (!firstEvnet) {
    // ElMessage.warning('没有可添加的数据')
    return
  }
  const eventId = firstEvnet.eventId
  const { filedData, cloneFiledData } = await asyncGetFieldList(eventId)

  state.propertyList = markRaw(filedData.eventField)
  state.group = {
    relation: 0, // 且、或
    isFirst: 1,
    propertyName: state.propertyList[0].fEn,
    propertyType: state.propertyList[0].fType,
    propertyNameDisplay: state.propertyList[0].fZh,
    propsFilterData: cloneFiledData,
    indexSelectData: {
      eventId,
      eventNameZh: firstEvnet.eventNameZh,
      eventName: firstEvnet.eventName,
      // false异常 无权限/隐藏时处理
      // permissionStatus,
    },
    // 选择维度时有值
    parentId: '',
    propertyStatus: true,
    condition: initVal().defaultConditions,
  }
}

watch(
  () => props.qp,
  (val) => {
    if (Object.keys(val).length) {
      mapTagData(val)
    }
  },
  {
    immediate: true,
  }
)

defineExpose({
  getResult,
  initData,
})
defineOptions({
  name: 'Condition',
})
</script>
<style lang="scss" scoped>
@import '@/views/user/components/Condition/index.scss';
.nd-first-last {
  height: 28px;
  :deep(.el-select__wrapper) {
    padding-top: 2px;
    padding-bottom: 2px;
    min-height: 28px;
  }
}
</style>
