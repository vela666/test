<template>
  <div class="nd-condition">
    <div
      :class="[
        disabled ? 'nd-condition-disabled' : '',
        'nd-condition-content',
      ]">
      <RuleAndOrSelect
        v-model="state.group.eventsUsersRelation"
        :containerShow="
          !!(state.group.events.length && state.group.users.filters.length)
        " />
      <div class="w100-percentage">
        <div class="nd-condition-content-list flex-column w100-percentage">
          <!-- 事件 -->
          <div>
            <div class="flex">
              <RuleAndOrSelect
                v-model="state.group.eventsRelation"
                :containerShow="state.group.events.length > 1" />
              <div class="flex-column gap5 w100-percentage">
                <div v-for="(item, index) of state.group.events" :key="index">
                  <div class="nd-event-list">
                    <div>
                      <span
                        class="c5473e8 c-pointer"
                        @click="switchDoneOrNotDone(item)">
                        {{
                          item.type === 1
                            ? $t('user.haveDone')
                            : $t('user.haveNotDone')
                        }}
                      </span>

                      <IndexSelect
                        @change="(val) => indexSelectChange(val, item)"
                        v-model="item.indexSelectData"
                        class="m0" />

                      <template v-if="item.type === 1">
                        <!--总次数等-->
                        <PropsCascader
                          :list="item.attributeList"
                          v-model="item.propsCascaderData" />

                        <DropDownItemSelection>
                          <div class="eas-drop-box">{{ item.equation }}</div>
                          <template #content>
                            <el-dropdown-item
                              v-for="operation of operationTypesList"
                              :key="operation.type"
                              @click="clickEquation(item, operation)">
                              {{ operation.label }}
                            </el-dropdown-item>
                          </template>
                        </DropDownItemSelection>

                        <CommonInput
                          v-if="item.equationName !== 'C06'"
                          v-model="item.num"
                          :clearable="false"
                          @change="(v) => numInput(v, item, 'num')"
                          desc=""
                          class="w80 h28"
                          :prefixSlot="false" />

                        <!-- int类型的区间绝对时间 -->
                        <template v-if="item.equationName === 'C06'">
                          <CommonInput
                            v-model="item.before"
                            :clearable="false"
                            @change="(v) => numInput(v, item, 'before')"
                            desc=""
                            class="w80 h28"
                            :prefixSlot="false" />

                          <span>{{ $t('user.and') }}</span>
                          <CommonInput
                            v-model="item.after"
                            :clearable="false"
                            @change="(v) => numInput(v, item, 'after')"
                            desc=""
                            class="w80 h28"
                            :prefixSlot="false" />
                          <span>{{ $t('user.between') }}</span>
                        </template>
                      </template>
                      <span>，{{ $t('user.in') }}</span>
                      <DateRangeSelect
                        placement="left"
                        h="28px"
                        :dateTextOnly="disabled"
                        v-model="item.time" />
                      <div class="nd-filter-operation">
                        <Tooltip>
                          <el-button
                            class="nd-operate-btn-active fz28 mr5"
                            text
                            @click="addSubEventFilter(item)">
                            <SvgIcon class="c86919d" name="funnel" />
                          </el-button>
                          <template #content>
                            {{ $t('common.addConditions') }}
                          </template>
                        </Tooltip>

                        <Tooltip>
                          <el-button
                            class="nd-operate-btn-active fz28 m0"
                            text
                            @click="handleDelRow('events', index)">
                            <SvgIcon class="c86919d" name="delete" />
                          </el-button>
                          <template #content>
                            {{ $t('analysis.path.deleteEvent') }}
                          </template>
                        </Tooltip>
                      </div>
                    </div>

                    <!-- 事件子项 -->
                    <PropsFilter
                      v-if="item.condition.filters.length"
                      :limit="['eventField']"
                      :data="item.propsFilterData"
                      v-model="item.condition"
                      @add="
                        (filterIndex, filterSubIndex) =>
                          addSubEventFilter(item, filterIndex, filterSubIndex)
                      "
                      @remove="
                        (filterIndex, filterSubIndex) =>
                          handleDelRow(
                            'events',
                            index,
                            filterIndex,
                            filterSubIndex
                          )
                      " />
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="!disabled"
              @click="addEventFilter()"
              class="nd-condition-content-add">
              <SvgIcon name="add1" />
              {{ $t('user.addEventHasOrNot') }}
            </div>
          </div>
          <!--  用户 -->
          <div>
            <PropsFilter
              :lineNum="1"
              :limit="['userField']"
              :data="state.allPropsFilterData"
              v-model="state.group.users"
              @add="
                (filterIndex, filterSubIndex) =>
                  addUserFilter(filterIndex, filterSubIndex)
              "
              @remove="
                (filterIndex, filterSubIndex) =>
                  handleDelRow('users', filterIndex, filterSubIndex)
              " />
            <div
              v-if="!disabled"
              @click="addUserFilter()"
              class="nd-condition-content-add">
              <SvgIcon name="add1" />
              {{ $t('user.userAttributesMet') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!--  <ConsolePanel
    position="left"
    :data="{
      ...state.group.events,
    }"
  />-->
</template>

<script setup>
import { reactive, watch } from 'vue'
import RuleAndOrSelect from '@/components/PropsFilter/RuleAndOrSelect.vue'

import {
  operationTypesList,
  operationTypesListMap,
} from '@/enumeration/user/common'
import { numberInputProcessing } from '@/utils'
import { past30DayRange } from '@/enumeration/date'
import useReq from './useReq'
import useEventStore from '@/store/modules/event'
import useOperate from '@/components/PropsFilter/useOperate'
import { isBoolean } from '@/utils/types'
import { ElMessage } from 'element-plus'
import { filterArraySpecifiedKey } from '@/utils/dataProcessing'

import { t } from '@/locales/i18n'

const {
  parseFilterData,
  parseFiltersFromRes,
  handleDelConditionData,
  handleAddConditionData,
} = useOperate()

const props = defineProps({
  groupDefine: {
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
const { asyncGetFieldList, asyncGetEventFields, asyncGetFieldStatus } = useReq()
// 对应1.0 eventInfo接口的数据
const eventStore = useEventStore()
const initVal = () => {
  const defaultConditions = {
    relation: 0,
    filters: [],
  }
  return {
    group: {
      // 用户和事件最外层关系 0且 1或
      eventsUsersRelation: 0,
      // 事件最外层关系 0且 1或
      eventsRelation: 0,
      // 用户最外层关系 0且 1或
      usersRelation: 0,
      events: [],
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
      users: defaultConditions,
    },
    eventFielList: [],
    paramsObj: {
      /*C13: [
        {
          label: 'before',
          value: '过去',
        },
        ...
      ],
      ...*/
    },
    allPropsFilterData: {},
    defaultConditions,
  }
}

const state = reactive(initVal())

const getAllFieldList = async () => {
  const data = await asyncGetFieldList()
  data.config.timestamp = filterArraySpecifiedKey(
    data.config.timestamp,
    ['C14'],
    true
  )
  data.config.datetime = filterArraySpecifiedKey(
    data.config.datetime,
    ['C14'],
    true
  )
  state.allPropsFilterData = data
}
getAllFieldList()
// 选择事件 templateEvent
const indexSelectChange = async (changeVal, item) => {
  const eventId = changeVal.eventId
  item.eventId = eventId
  item.eventName = changeVal.eventNameZh
  item.eventEn = changeVal.eventName
  item.permissionStatus = changeVal.permissionStatus
  // 清空事件查询筛选项
  item.condition = initVal().defaultConditions
  // 改变事件默认为第一个指标
  const { commonList, eventFields } = await asyncGetEventFields(eventId)
  const filedData = await asyncGetFieldList(eventId)

  // item.attribute = commonList[0].label
  item.attributeList = eventFields
  item.propsCascaderData = {
    analysis: commonList[0].value,
    analysisDesc: commonList[0].label,
  }
  item.propsFilterData = filedData
}

// 某个事件选择指标 getCascader
/*const propsCascaderChange = (v, item) => {
  item.propertyPermissionStatus = true
}*/

// 做过、未做过切换
const switchDoneOrNotDone = (item) => {
  item.type = item.type ? 0 : 1
  item.condition = initVal().defaultConditions
}

// 某个事件的筛选选择大于、小于等
const clickEquation = (item, operation) => {
  item.equation = operation.label
  item.equationName = operation.type
  // 区间
  if (operation.type !== 'C06' && String(Number(item.num)) === 'NaN') {
    item.num = 0
  }
}

const numInput = (v, item, key) => {
  item[key] = numberInputProcessing({ v, decimal: Infinity })
}

// 添加事件筛选 getCreatedDate
const addEventFilter = async () => {
  const firstEvnet = eventStore.currentEventList.find(
    (i) => i.permissionStatus !== false
  )
  if (!firstEvnet) {
    ElMessage.warning(t('analysis.path.eventEmpty'))
    return
  }
  const eventId = firstEvnet.eventId
  const { eventFields, commonList } = await asyncGetEventFields(eventId)
  const filedData = await asyncGetFieldList(eventId)
  console.log({
    eventId,
    eventNameZh: firstEvnet.eventNameZh,
    eventName: firstEvnet.eventName,
  })
  state.group.events.push({
    type: 1, // 做过、没做过
    eventName: firstEvnet.eventNameZh,
    eventId,
    eventEn: firstEvnet.eventName,
    permissionStatus: firstEvnet.permissionStatus,

    attributeList: eventFields,
    equation: operationTypesList[0].label,
    equationName: operationTypesList[0].type,

    num: 0,
    before: 0,
    after: 1,
    time: {
      ...past30DayRange,
      shortcutType: 'past30Day',
    },
    propsFilterData: filedData,
    indexSelectData: {
      eventId,
      eventNameZh: firstEvnet.eventNameZh,
      eventName: firstEvnet.eventName,
    },
    propsCascaderData: {
      analysis: commonList[0].value,
      analysisDesc: commonList[0].label,
    },
    condition: {
      relation: 0,
      filters: [],
    },
  })
}

// 添加事件子项筛选 addScreen
const addSubEventFilter = async (item, filterIndex, filterSubIndex) => {
  item.condition = handleAddConditionData({
    condition: item.condition,
    noLimit: ['eventField'],
    conditionList: item.propsFilterData,
    index: filterIndex,
  })
}

// 添加用户筛选 addUserScreen
const addUserFilter = async (i, ii) => {
  state.group.users = handleAddConditionData({
    condition: state.group.users,
    noLimit: ['userField'],
    conditionList: state.allPropsFilterData,
    index: i,
  })
}

// 删除行 handleDelete
const handleDelRow = (type, i, index, subIndex) => {
  if (type === 'events') {
    if (!Number.isInteger(index)) {
      state.group[type].splice(i, 1)
    } else {
      state.group[type][i].condition = handleDelConditionData({
        condition: state.group[type][i].condition,
        index,
        subIndex,
      })
    }
  } else {
    state.group[type] = handleDelConditionData({
      condition: state.group[type],
      index: i,
      subIndex: index,
    })
  }
}

// 处理分群规则数据
const mapGroupData = async (newValue) => {
  state.group.eventsUsersRelation = newValue.eventsUsersRelation
  state.group.eventsRelation = newValue.eventsRelation
  state.group.usersRelation = newValue.usersRelation
  // 事件
  let eventList = []
  for (let i = 0; i < newValue.events.length; i++) {
    const item = newValue.events[i]
    const event = eventStore.currentEventList.find(
      (e) => e.eventName === item.eventName
    )
    const fieldMap = new Map()
    let eventNameZh = ''
    let eventId = event ? event.eventId : 0
    let propertyNameDisplay = ''
    let eventFieldResult = {}

    // 没有事件
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
      type: String(item.num) === '0' && item.calcuSymbol === 'C00' ? 0 : 1,
      eventName: eventNameZh || event?.eventNameZh || item.eventNameDisplay,
      eventId: eventId,
      eventEn: item.eventName,
      permissionStatus: event ? event.permissionStatus : true,

      attributeList: eventFieldResult,

      propertyName: item.propertyName,
      propertyNameDisplay:
        propertyNameDisplay ||
        fieldMap.get(item.propertyName)?.fZh ||
        item.propertyNameDisplay,
      // 选择维度属性时有值
      parentId: item.parentId,

      equation: operationTypesListMap[item.calcuSymbol],
      equationName: item.calcuSymbol,

      num: item.num,
      before: 0,
      after: 1,
      time: {
        date: [item.startTime, item.endTime],
        diff: '',
      },

      indexSelectData: {
        eventId,
        eventNameZh: eventNameZh || event?.eventNameZh || item.eventNameDisplay,
        eventName: event?.eventName || item.eventName,
      },
      propsCascaderData: {
        ...item,
      },
      // 条件
      condition: {
        relation: item.relation,
        filters: [],
      },
    }

    if (item.allDateParams) {
      newItem.time = item.allDateParams
    }
    // 新参数里会存在shortcutType
    if (!Reflect.has(newItem.time, 'shortcutType') && item.recentDay) {
      const [start, end] = item.recentDay.replace(/-/g, '').split(',')
      newItem.time.diff = `${end}-${start}`
    }

    if (item.calcuSymbol === 'C06') {
      const [before, after] = item.num.split(',')
      newItem.before = before
      newItem.after = after
    }

    newItem.propsFilterData = await asyncGetFieldList(eventId)
    if (item.filts?.length) {
      newItem.condition = parseFiltersFromRes(item)
    }
    eventList.push(newItem)
  }

  state.group.events = eventList
  // 用户
  state.group.users = parseFiltersFromRes({
    filts: newValue.users,
    relation: newValue.usersRelation,
  })
}

// 标签时 type传值
const getResult = (type) => {
  return new Promise((resolve, reject) => {
    const result = {
      eventsRelation: state.group.eventsRelation,
      eventsUsersRelation: state.group.eventsUsersRelation,
      // usersRelation: state.group.usersRelation,
      usersRelation: 0,
      events: [],
      users: [],
      filterType: 0,
    }
    let checkMessage = ''
    // 事件
    for (let i = 0; i < state.group.events.length; i++) {
      const item = state.group.events[i]
      const analysis = item.propsCascaderData.analysis
      const analysisDesc = item.propsCascaderData.analysisDesc
      if (type !== 'notValidate') {
        if (item.type === 1 && (analysis === 'A00' || analysis === 'A09')) {
          // 校验总次数跟去重数
          if (
            (parseInt(item.num) <= 0 &&
              item.equationName !== 'C03' &&
              item.equationName !== 'C01' &&
              item.equationName !== 'C06') ||
            (parseInt(item.num) < 0 &&
              (item.equationName === 'C03' || item.equationName === 'C01'))
          ) {
            checkMessage = t('user.haveDoneMsg', [analysisDesc])
            break
          }
          if (
            (item.equationName === 'C06' && item.before < 0) ||
            item.after < 0
          ) {
            checkMessage = t('user.haveDoneMsg', [analysisDesc])
            break
          }
        }
        if (!item.num && String(item.num) !== '0') {
          !checkMessage && (checkMessage = t('user.mustBeNumber'))
          break
        }
      }
      const eventObj = {
        eventNameDisplay: item.eventName,
        eventName: item.eventEn,
        num:
          item.type === 1
            ? item.equationName === 'C06'
              ? `${item.before},${item.after}`
              : item.num
            : 0, // 未做过默认0
        relation: 0,
        recentDay: '',
        startTime: item.time.date[0],
        endTime: item.time.date[1],
        propertyName: item.propsCascaderData.propertyName || '',
        propertyNameDisplay: item.propsCascaderData.propertyNameDisplay || '',
        parentId: item.propsCascaderData.parentId || '',
        analysis,
        // analysisDesc: item.attribute,
        analysisDesc,
        allDateParams: item.time,
        shortcutType: item.time.shortcutType,
        calcuSymbol: item.type === 1 ? item.equationName : 'C00', // 未做过默认等于
      }
      const recentDay = item.time.diff.split('-')
      if (recentDay.length === 2) {
        eventObj.recentDay = `${recentDay[1] ? `-${recentDay[1]}` : ''},-${recentDay[0]}`
      }
      if (item.condition.filters.length) {
        const event = parseFilterData(item.condition)
        if (isBoolean(event)) {
          checkMessage = t('common.filterConditionErr')
          break
        } else {
          eventObj.filts = event.filts
          eventObj.relation = event.relation
        }
      }
      result.events.push(eventObj)
    }
    // 用户
    const user = parseFilterData(state.group.users)
    if (isBoolean(user)) {
      checkMessage = t('common.filterConditionErr')
    } else {
      result.users = user.filts
      result.usersRelation = user.relation
    }

    if (checkMessage) {
      reject(checkMessage)
      return
    }
    resolve(result)
  })
}

watch(
  () => props.groupDefine,
  (val) => {
    if (Object.keys(val).length) {
      mapGroupData(val)
    }
  },
  {
    immediate: true,
  }
)
defineExpose({
  getResult,
})
defineOptions({
  name: 'Condition',
})
</script>
<style lang="scss" scoped>
@import 'index';
</style>
