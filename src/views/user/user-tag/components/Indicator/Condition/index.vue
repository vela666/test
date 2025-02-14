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
                      <IndexSelect
                        @change="indexSelectChange"
                        v-model="state.group.indexSelectData"
                        class="m0" />
                      <span>{{ $t('common.of') }}</span>
                      <!--总次数等-->
                      <PropsCascader
                        @change="propsCascaderChange"
                        :list="state.group.attributeList"
                        v-model="state.group.propsCascaderData" />
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
import { reactive, watch } from 'vue'

import { past7DayRange } from '@/enumeration/date'
import useReq from './useReq'
import useEventStore from '@/store/modules/event'
import useOperate from '@/components/PropsFilter/useOperate'
import { isBoolean } from '@/utils/types'
import { ElMessage } from 'element-plus'
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
const { asyncGetFieldList, asyncGetFieldStatus, asyncGetEventFields } = useReq()
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
    group: {},
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
  const eventId = changeVal.eventId
  // 清空事件查询筛选项
  state.group.condition = initVal().defaultConditions

  const { commonList, eventFields } = await asyncGetEventFields(eventId)
  state.group.attributeList = eventFields
  state.group.propsCascaderData = {
    analysis: commonList[0].value,
    analysisDesc: commonList[0].label,
  }
  state.group.propsFilterData = await asyncGetFieldList(eventId)
}

const propsCascaderChange = (val) => {
  console.log(val)
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
    const { eventFields } = await asyncGetEventFields(eventId)
    eventFieldResult = eventFields
    eventFields.field.forEach((item) => fieldMap.set(item.fEn, item))
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

  const newItem = {
    relation: item.relation,
    indexSelectData: {
      eventId,
      eventNameZh: eventNameZh || event?.eventNameZh || item.eventNameDisplay,
      eventName: event?.eventName || item.eventName,
      // false异常 无权限/隐藏时处理
      // permissionStatus,
    },

    attributeList: eventFieldResult,
    propsCascaderData: {
      // ...item,
      // 维度时有值
      parentId: item.parentId,
      analysis: item.analysis,
      analysisDesc: item.analysisDesc,
      propertyName: item.propertyName,
      propertyType: item.propertyType,
      propertyNameDisplay:
        propertyNameDisplay ||
        fieldMap.get(item.propertyName)?.fZh ||
        item.propertyNameDisplay,
    },
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

  newItem.propsFilterData = await asyncGetFieldList(eventId)
  if (item.filts?.length) {
    newItem.condition = parseFiltersFromRes(item)
  }
  state.group = newItem
}

// 标签时 type传值
const getResult = () => {
  return new Promise((resolve, reject) => {
    if (!state.group.indexSelectData || !state.group.propsCascaderData) {
      reject(t('user.userCompletionNoEmpty'))
      return
    }
    // 事件
    const eventObj = {
      eventNameDisplay: state.group.indexSelectData?.eventNameZh,
      eventName: state.group.indexSelectData?.eventName,
      relation: state.group.relation,
      allDateParams: state.dateRange,
      shortcutType: state.dateRange.shortcutType,
      startTime: state.dateRange.date[0],
      endTime: state.dateRange.date[1],
      analysis: state.group.propsCascaderData?.analysis,
      analysisDesc: state.group.propsCascaderData?.analysisDesc,
      propertyName: state.group.propsCascaderData?.propertyName || '',
      propertyType: state.group.propsCascaderData?.propertyType || '',
      propertyNameDisplay:
        state.group.propsCascaderData?.propertyNameDisplay || '',
      // 选择维度时有值
      parentId: state.group.propsCascaderData?.parentId,
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
  const { eventFields, commonList } = await asyncGetEventFields(eventId)
  const filedData = await asyncGetFieldList(eventId)

  state.group = {
    relation: 0, // 且、或
    propsFilterData: filedData,
    indexSelectData: {
      eventId,
      eventNameZh: firstEvnet.eventNameZh,
      eventName: firstEvnet.eventName,
      // 组件内部处理 false异常 无权限/隐藏时处理
      // permissionStatus,
    },
    parentId: '',
    attributeList: eventFields,
    propsCascaderData: {
      analysis: commonList[0].value,
      analysisDesc: commonList[0].label,
    },
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
</style>
