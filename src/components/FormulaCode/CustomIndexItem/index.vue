<script setup>
import { ref, watch, computed } from 'vue'
import useOperate from '@/components/PropsFilter/useOperate'
import { v4 as uuidv4 } from 'uuid'
import useEventStore from '@/store/modules/event.js'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { getEventFields, getFieldList } from '@/api/modules/analysis/common.js'
import { tableKeysArr } from '@/enumeration'
import { t } from '@/locales/i18n'
defineOptions({
  name: 'CustomIndexItem',
  inheritAttrs: false,
})
/**
 * modelValue 值结构
 * {
 *  events: {},
    eventFields: {},
    eventFilters: {
      relation: 0,
      filters: [],
    },
    hasEventSplit: 0,
 * }
*/
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  splitEvents: {
    type: Array,
    default: () => [],
  },
  // 分析指标类型 1 事件分析、 2 分布分析、3 留存分析、4 ltv分析-回访事件、5 ltv分析-初始日期指标、6 ltv分析-同时展示指标
  analysisType: {
    type: [String, Number],
    default: 1,
  },
  anyEvent: {
    type: Boolean,
    default: false,
  },
})

const {
  parseFilterData,
  handleDelConditionData,
  handleAddConditionData,
  omitFiltersHandler,
} = useOperate()
const eventStore = useEventStore()
const currentEventList = computed(() => {
  if (props.anyEvent === true) {
    const count =
      eventStore.currentEventList.filter((el) => el.permissionStatus !== false)
        ?.length || 0
    let data = [...eventStore.currentEventList]
    if (count > 0) {
      data = [
        ...data,
        {
          eventId: -1,
          eventName: '任意事件',
          eventNameZh: t('analysis.anyEvent'),
        },
      ]
    }
    return data
  } else {
    return eventStore.currentEventList
  }
})

const emit = defineEmits(['update:modelValue'])

const datas = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})

const eventFieldsData = ref({})
const fieldsList = ref({})

watch(
  () => props.splitEvents,
  () => {
    if (
      props.splitEvents
        .map((el) => el?.events?.eventName)
        .includes(datas.value.events?.eventName)
    ) {
      datas.value['hasEventSplit'] = datas.value['hasEventSplit'] || 1
    } else {
      datas.value['hasEventSplit'] = datas.value['hasEventSplit'] || 0
    }
  },
  {
    immediate: true,
    deep: true,
  }
)

/* if (props.modelValue?.hasEventSplit === undefined) {
  datas.value['hasEventSplit'] = 0
} */

if (!props.modelValue?.events) {
  getInitValue()
} else {
  setFieldSource()
}

async function setFieldSource() {
  eventFieldsData.value = await fetchEventFieldsData(
    props.modelValue?.events?.eventId
  )
  fieldsList.value = await fetchFieldList(props.modelValue?.events?.eventId)
}

const splitEventNames = computed(() => {
  return props.splitEvents.map((el) => el?.events?.eventName)
})

async function getInitValue() {
  for (const item of currentEventList.value) {
    if (item?.eventId) {
      datas.value['events'] = cloneDeep(item)
      break
    }
  }
  await setFieldsAbout(datas.value?.events?.eventId)
}

// 设置事件属性数据源和选中第一个分析属性、筛选数据源
async function setFieldsAbout(eventId) {
  eventFieldsData.value = await fetchEventFieldsData(eventId)
  datas.value['eventFields'] = setInitEventField(eventFieldsData.value)
  fieldsList.value = await fetchFieldList(eventId)
}

async function fetchEventFieldsData(eventId) {
  let temp = {}
  if (eventId) {
    const res = await getEventFields({
      eventId,
      analysisType: props.analysisType,
    })
    if (res.code === 200 && res.data) {
      if (Number(props.analysisType) === 2) {
        const obj = new Map(
          Object.entries(res.data.common).sort((a, b) =>
            a[0].localeCompare(b[0])
          )
        )
        const common = {}
        for (const [key, value] of obj) {
          common[key] = value
        }
        temp = cloneDeep({ ...res.data, common })
      } else {
        temp = cloneDeep(res.data)
      }
    }
  }
  return temp
}

function setInitEventField(data) {
  let res = {}
  if (data?.common) {
    for (const key in data.common) {
      res = {
        analysis: key,
        analysisDesc: data.common[key],
      }
      break
    }
  }
  return res
}

async function fetchFieldList(eventIds) {
  let temp = {}
  if (eventIds) {
    const res2 = await getFieldList({ eventIds })
    if (res2.code === 200 && res2.data) {
      temp = cloneDeep(res2.data)
    }
  }
  return temp
}

const limit = tableKeysArr
//添加筛选条件
const addFilter = (index) => {
  copyVal.value = handleAddConditionData({
    condition: copyVal.value,
    noLimit: limit,
    conditionList: fieldsList.value,
    index,
  })
}

const deleteFilter = (index, subIndex) => {
  copyVal.value = handleDelConditionData({
    condition: copyVal.value,
    index,
    subIndex,
  })
}
const initval = () => ({
  relation: 0,
  filters: [],
})

const copyVal = ref(initval())

const visible = ref(false)

const cancel = () => {
  visible.value = false
}

const confirm = () => {
  const res = parseFilterData(copyVal.value)
  if (res === false) {
    ElMessage.warning(t('common.filterConditionErr'))
    return
  }
  if (!datas.value?.eventFilters) {
    datas.value['eventFilters'] = initval()
  }
  datas.value.eventFilters = cloneDeep(copyVal.value)
  visible.value = false
}

const indexChange = async (val) => {
  await setFieldsAbout(val?.eventId)
  omitFilters()
}

const omitFilters = () => {
  const filters = datas.value?.eventFilters?.filters
  if (!Array.isArray(filters)) return
  datas.value.eventFilters.filters = omitFiltersHandler(
    fieldsList.value,
    filters
  )
}
const appDom = document.getElementById('app')

watch(visible, (val) => {
  if (val) {
    if (
      datas.value?.eventFilters &&
      datas.value.eventFilters?.filters?.length
    ) {
      copyVal.value = cloneDeep(datas.value.eventFilters)
    } else {
      copyVal.value = cloneDeep(
        handleAddConditionData({
          condition: initval(),
          noLimit: limit,
          conditionList: fieldsList.value,
        })
      )
    }
  }
})

const showPopover = () => {
  appDom.classList.add('prevent-no')
}

const hidePopover = () => {
  appDom.classList.remove('prevent-no')
  visible.value = false
  copyVal.value = initval()
}
</script>

<template>
  <div class="custom-index-item">
    <IndexSelect
      :anyEvent="anyEvent"
      v-model="datas.events"
      style="height: 100%"
      @change="indexChange" />
    <SplitBtn
      v-if="splitEventNames.includes(datas.events?.eventName)"
      v-model="datas.hasEventSplit" />
    <el-popover
      :visible="visible"
      placement="bottom-start"
      popper-class="custom-filter__dropdown"
      @hide="hidePopover"
      @show="showPopover">
      <template #reference>
        <div
          @click.stop="visible = true"
          :class="[
            'custom-filter-icon',
            'mr8',
            { 'has-filters': datas?.eventFilters?.filters?.length },
            { 'is-unfold': visible },
          ]">
          <el-tooltip
            effect="dark"
            :content="$t('analysis.filteringEvents')"
            placement="top"
            :hide-after="0">
            <svg-icon name="filter"></svg-icon>
          </el-tooltip>
        </div>
      </template>
      <div class="custom-filter-box">
        <div class="custom-filter-box__header">
          {{ $t('common.filterConditions') }}
        </div>
        <div class="custom-filter-box__body" @click.stop>
          <div class="filter-content">
            <PropsFilter
              :data="fieldsList"
              v-model="copyVal"
              @add="addFilter"
              @remove="deleteFilter"
              :limit="limit" />
          </div>
          <el-button type="primary" text @click="addFilter">
            <svg-icon name="funnel-filter" class="fz16 mr3"></svg-icon>
            {{ $t('analysis.addConditions') }}
          </el-button>
        </div>
        <div class="custom-filter-box__footer">
          <el-button text class="skip" @click="cancel">
            {{ $t('btn.cancel') }}
          </el-button>
          <el-button type="primary" @click="confirm">
            {{ $t('btn.confirm') }}
          </el-button>
        </div>
      </div>
    </el-popover>
    <div style="margin-right: 8px">{{ $t('common.of') }}</div>
    <PropsCascader
      :list="eventFieldsData"
      v-model="datas.eventFields"
      style="height: 100%" />
  </div>
</template>

<style scoped lang="scss">
.custom-index-item {
  height: 100%;
  display: inline-flex;
  align-items: center;
}

.custom-filter-box {
  pointer-events: auto;
  width: 550px;
  &__header {
    width: 100%;
    height: 54px;
    font-size: var(--eas-font-size-medium);
    font-weight: bold;
    color: #333;
    padding-left: 32px;
    line-height: 54px;
  }
  &__body {
    width: 100%;
    padding: 0px 3px 0px 32px;
    .filter-content {
      max-height: 320px;
      overflow-y: auto;
      padding-right: 32px;
      margin-bottom: 10px;
    }
  }
  &__footer {
    width: 100%;
    height: 81px;
    padding-right: 32px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
.has-filters {
  color: var(--eas-color-primary) !important;
}
.is-unfold {
  border-color: var(--eas-color-primary) !important;
  color: var(--eas-color-primary) !important;
  background-color: #fff !important;
}
</style>
<style lang="scss">
.el-popover.custom-filter__dropdown {
  box-shadow: 0px 3px 6px 1px rgba(28, 39, 80, 0.2);
  border-radius: 10px;
  margin-top: -12px;
  padding: 0px;
  width: 550px !important;
  .el-popper__arrow {
    display: none;
  }
}
</style>
