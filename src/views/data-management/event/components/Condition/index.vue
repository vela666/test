<template>
  <div class="nd-condition">
    <div
      :class="[
        disabled ? 'nd-condition-disabled' : '',
        'nd-condition-content',
      ]">
      <div class="w100-percentage">
        <div class="nd-condition-content-list flex-column w100-percentage">
          <!-- 事件 -->
          <div>
            <div class="flex-column gap10 w100-percentage">
              <div v-for="(item, index) of state.eventList" :key="index">
                <div class="nd-event-list">
                  <div class="flex-center">
                    <div class="nd-event-serial-number">{{ index + 1 }}</div>

                    <el-select
                      class="nd-event-select min-h-auto"
                      v-model="item.eventName"
                      filterable
                      @change="eventChange(item)">
                      <el-option
                        v-for="event of state.optionalEvents"
                        :key="event.eventName"
                        :value="event.eventName"
                        :label="event.eventNameZh" />
                    </el-select>

                    <div
                      class="nd-filter-operation"
                      v-if="state.eventList.length > 1">
                      <!--                      <el-button
                        class="nd-operate-btn-active fz28 mr5"
                        text
                        @click="addSubEventFilter(item)"
                      >
                        <SvgIcon class="c86919d" name="funnel" />
                      </el-button>-->
                      <Tooltip>
                        <el-button
                          class="nd-operate-btn-active fz28 m0"
                          text
                          @click="handleDelRow(index)">
                          <SvgIcon class="c86919d" name="delete" />
                        </el-button>
                        <template #content>
                          {{ $t('dataManagement.event.deleteEvent') }}
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
                        addSubEventFilter(item, filterIndex)
                    "
                    @remove="
                      (filterIndex, filterSubIndex) =>
                        handleDelRow(index, filterIndex, filterSubIndex)
                    " />

                  <span
                    @click="addSubEventFilter(item)"
                    class="inline-flex-center c-pointer c5473e8 ml26 mt5">
                    <el-button class="fz28" text type="primary">
                      <SvgIcon name="funnel" />
                    </el-button>
                    {{ $t('common.addConditions') }}
                  </span>
                </div>
              </div>
            </div>
            <div
              v-if="!disabled"
              @click="addEventFilter()"
              class="nd-condition-content-add mt10">
              <SvgIcon name="add1" />
              {{ $t('dataManagement.event.addEvent') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { markRaw, reactive, watch } from 'vue'
import { asyncGetSelectEnableEventList } from '@/api/modules/data-management/event'

import useOperate from '@/components/PropsFilter/useOperate'
import { isBoolean } from '@/utils/types'
import { ElMessage } from 'element-plus'
import { getFieldList } from '@/api/modules/analysis/common'
import { t } from '@/locales/i18n'

const {
  parseFilterData,
  parseFiltersFromRes,
  handleDelConditionData,
  handleAddConditionData,
} = useOperate()

const props = defineProps({
  groupDefine: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const initVal = () => {
  return {
    eventList: [],
    // filterType 的意义 0是没嵌套 1是嵌套
    // relation 0且 1或
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
    optionalEvents: [],
    optionalEventMap: {},
    defaultCondition: {
      relation: 0,
      filters: [],
    },
  }
}

const state = reactive(initVal())

const asyncGetFieldList = async (eventNames = '') => {
  if (!eventNames) return {}
  const { data } = await getFieldList({ eventNames })
  return {
    ...data,
    // 过滤维度属性3和虚拟属性4
    eventField: data.eventField.filter((el) => ![3, 4].includes(el.filedType)),
  }
}

const getSelectEventList = async (exec = true) => {
  const { data } = await asyncGetSelectEnableEventList()

  state.optionalEventMap = markRaw(
    data.reduce((p, item) => {
      // p[item.eventId] = item
      p[item.eventName] = item
      return p
    }, {})
  )
  state.optionalEvents = markRaw(data)

  if (exec) {
    const eventId = data[0]?.eventId || ''
    const eventName = data[0]?.eventName || ''
    const filedData = await asyncGetFieldList(eventName)
    state.eventList = [
      {
        condition: initVal().defaultCondition,
        eventId,
        eventName,
        relation: 0,
        propsFilterData: filedData,
      },
    ]
  }
}

const eventChange = async (val) => {
  val.condition = initVal().defaultCondition
  val.propsFilterData = await asyncGetFieldList(val.eventName)
}
// 添加事件筛选 getCreatedDate
const addEventFilter = async () => {
  const data = state.optionalEvents[0]
  if (!data) {
    ElMessage.warning(t('analysis.path.eventEmpty'))
    return
  }
  const eventId = data.eventId
  const eventName = data.eventName
  const filedData = await asyncGetFieldList(eventName)
  state.eventList.push({
    relation: 0,
    eventId,
    eventName,
    condition: initVal().defaultCondition,
    propsFilterData: filedData,
  })
}

// 添加事件子项筛选 addScreen
const addSubEventFilter = async (item, filterIndex) => {
  item.condition = handleAddConditionData({
    condition: item.condition,
    noLimit: ['eventField'],
    conditionList: item.propsFilterData,
    index: filterIndex,
  })
}

// 删除行 handleDelete
const handleDelRow = (i, index, subIndex) => {
  if (!Number.isInteger(index)) {
    state.eventList.splice(i, 1)
  } else {
    state.eventList[i].condition = handleDelConditionData({
      condition: state.eventList[i].condition,
      index,
      subIndex,
    })
  }
}

// 处理分群规则数据
const mapGroupData = async (newValue) => {
  // 事件
  const temp = []
  for (let i = 0; i < newValue.length; i++) {
    const item = newValue[i]
    const newItem = {
      eventId: item.eventId,
      // 防止使用的自定义事件被删了找不到报错 后端处理后就不需要了
      eventName: item.eventName,
      // 条件
      condition: initVal().defaultCondition,
      relation: item.relation,
    }

    newItem.propsFilterData = await asyncGetFieldList(item.eventName)
    if (item.filts?.length) {
      newItem.condition = parseFiltersFromRes(item)
    }
    temp.push(newItem)
  }
  state.eventList = temp
}

const getResult = () => {
  return new Promise((resolve, reject) => {
    const result = []
    let checkMessage = ''
    // 事件
    for (let i = 0; i < state.eventList.length; i++) {
      const item = state.eventList[i]
      const eventObj = {
        eventId:
          state.optionalEventMap[item.eventName]?.eventId || item.eventId,
        eventName: item.eventName,
        filts: [],
        relation: item.relation || 0,
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
      result.push(eventObj)
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
    getSelectEventList(!val)
    if (!val) return
    try {
      const data = JSON.parse(val)
      if (Array.isArray(data) && data.length) {
        mapGroupData(data)
      }
    } catch (e) {
      console.log(e)
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
@import '@/views/user/components/Condition/index';
.nd-event-list {
  > :deep(.props-filter) {
    margin-left: 26px !important;
  }
}

.nd-event-serial-number {
  width: 24px;
  height: 24px;
  border-radius: 2px;
  background-color: var(--eas-color-primary);
  font-size: 12px;
  color: #fff;
  text-align: center;
  line-height: 24px;
}

.nd-event-select {
  max-width: 240px;
  :deep(.el-select__wrapper) {
    padding: 2px 12px;
  }
}
</style>
