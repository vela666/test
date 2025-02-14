<script setup>
defineOptions({
  name: 'EventSidebar',
})
import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { cloneDeep, omit, isObject } from 'lodash-es'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { v4 as uuidv4 } from 'uuid'
import useOperate from '@/components/PropsFilter/useOperate'

const state = reactive({
  formData: {
    events: {},
    eventFields: {},
    eventFilters: {
      relation: 0,
      filters: [],
    },
    eventFieldsData: {},
    fieldsList: {},
    customizable: false,
    index: 0,
  },
  disabled: false,
  loading: false,
})

const { parseFilterData, parseFiltersFromRes, omitFiltersHandler } =
  useOperate()

const {
  getFirstEvent,
  fetchEventFieldsData,
  setInitEventField,
  fetchFieldList,
  getFirstField,
  setIndexDisplay,
} = useAanlysisUtils({
  anyEvent: true,
  analysisType: 3,
  filterFType: ['boolean'],
})

onMounted(() => {
  //getAnalysisItem()

  const body = document.getElementsByTagName('body')[0]
  body.style.setProperty('min-width', 'auto')

  state.loading = true
  const data = {
    type: 'create',
    data: 'create',
  }
  window.addEventListener('message', addEventMessage)
  setTimeout(() => {
    nextTick(() => {
      window.parent.postMessage(data, '*')
    })
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('message', addEventMessage)
})

const addEventMessage = async (e) => {
  if (e.data && e.data.type === 'submit') {
    putParams()
  } else if (e.data) {
    console.log(e.data.type, '================>', e.data)
    if (e.data && e.data.appId) {
      sessionStorage.setItem('appId', e.data.appId)
      if (e.data.type === 'create') {
        await getAnalysisItem()
      }
    }
    if (e.data.type === 'view' || e.data.type === 'copy') {
      const item = await setIndexDisplay([e.data.data])

      state.formData = cloneDeep(item[0])
      if (e.data && e.data.type === 'view') {
        state.disabled = true
      }
    }
  }
  state.loading = false
}

const putParams = () => {
  const r = getRequestParams()
  let errMsg = ''
  if (!isObject(r)) {
    if (r === false) {
      errMsg = '筛选条件参数错误'
    } else if (r === -1) {
      errMsg = '分析指标参数为空'
    } else {
      errMsg = '请输入指标名'
    }
  }
  const data = {
    type: errMsg ? 'error' : 'success',
    data: errMsg || r,
  }
  window.parent.postMessage(data, '*')
}

const getRequestParams = () => {
  // 多事件 多筛选
  const item = state.formData

  let temp = {}
  // 分析指标为空
  if (!item?.events?.eventName || !item?.eventFields?.analysis) return -1
  temp = {
    eventName: item.events.eventName,
    eventNameDisplay: item.events.eventNameZh,
    eventType: item.events.eventType,
    propertyName: item.eventFields.propertyName,
    propertyNameDisplay: item.eventFields.propertyNameDisplay,
    analysis: item.eventFields.analysis,
    analysisDesc: item.eventFields.analysisDesc,
    filts: [],
    relation: item.eventFilters.relation,
    alias: item.alias,
    parentId: item.eventFields.parentId || '',
    hasEventSplit: item.hasEventSplit,
  }

  const filters = parseFilterData(item.eventFilters)
  if (!filters) {
    return false
  }
  temp.filts = filters.filts

  return temp
}

const eventChange = async (index, val) => {
  if (val?.eventId) {
    const resData = await fetchEventFieldsData(val?.eventId, 3)
    const fieldsListData = await fetchFieldList(val?.eventId)
    state.formData = {
      ...state.formData,
      eventFieldsData: cloneDeep(resData),
      eventFields: setInitEventField(resData),
      fieldsList: cloneDeep(fieldsListData),
    }
    omitFilters(fieldsListData, index)
  }
}

// 添加筛选条件: 有fIndex则是添加子筛选项
const addFilter = (index, fIndex) => {
  if (fIndex !== undefined) {
    if (Array.isArray(state.formData.eventFilters?.filters[fIndex]?.filters)) {
      state.formData.eventFilters.filters[fIndex].filters.push({
        id: uuidv4(),
        ...getFirstField(state.formData.fieldsList),
      })
    } else {
      const oldItem = cloneDeep(state.formData.eventFilters.filters[fIndex])
      state.formData.eventFilters.filters[fIndex] = {
        id: oldItem.id,
        relation: 0,
        filters: [
          { ...oldItem, id: uuidv4() },
          {
            id: uuidv4(),
            ...getFirstField(state.formData.fieldsList),
          },
        ],
      }
    }
  } else {
    const fieldsList = state.formData.fieldsList
    if (!isObject(fieldsList) || Object.keys(fieldsList).length === 0) return
    if (Array.isArray(state.formData.eventFilters?.filters)) {
      state.formData.eventFilters.filters.push({
        id: uuidv4(),
        ...getFirstField(fieldsList),
      })
    }
  }
}

// 删除筛选项:有subfIndex则是删除子筛选项
const deleteFilter = (index, fIndex, subfIndex) => {
  if (subfIndex !== undefined) {
    state.formData.eventFilters?.filters[fIndex]?.filters?.splice(subfIndex, 1)
    const len = state.formData.eventFilters?.filters[fIndex]?.filters?.length
    if (len === 1) {
      const temp = omit(
        state.formData.eventFilters?.filters[fIndex]?.filters?.[len - 1],
        ['id']
      )
      const tempScreen = omit(state.formData.eventFilters?.filters[fIndex], [
        'filters',
        'relation',
      ])
      state.formData.eventFilters.filters[fIndex] = {
        ...temp,
        ...tempScreen,
      }
    }
  } else {
    state.formData.eventFilters?.filters?.splice(fIndex, 1)
  }
}

// 处理筛选列表中在数据源中不存在的筛选属性
const omitFilters = (data, index) => {
  // index === undefined  全局筛选
  let temp =
    index === undefined
      ? state.globalFilters?.filters
      : state.formData.eventFilters?.filters
  if (!Array.isArray(temp) || temp.length === 0) return
  const newFilters = omitFiltersHandler(data, temp)

  if (index === undefined) {
    state.globalFilters.filters = newFilters
  } else {
    state.formData.eventFilters.filters = newFilters
  }
}

// 产生一项指标
async function getAnalysisItem() {
  const temp = {
    id: uuidv4(),
    events: {},
    eventFields: {},
    eventFilters: {
      relation: 0,
      filters: [],
    },
    alias: '',
    aliasEdited: false,
    customizable: false,
    hasEventSplit: 0,
    eventFieldsData: {},
    fieldsList: {},
  }
  temp.events = getFirstEvent()
  if (temp?.events?.eventId) {
    temp.eventFieldsData = await fetchEventFieldsData(temp?.events?.eventId, 3)
    temp.eventFields = setInitEventField(temp.eventFieldsData)
    // 获取筛选条件的数据源
    temp.fieldsList = await fetchFieldList(temp.events.eventId)
  }
  state.formData = temp
}
</script>
<template>
  <div v-loading="state.loading" :class="{ 'index-disabled': state.disabled }">
    <AnalysisIndexItem
      v-model:event-data="state.formData.events"
      v-model:event-fields="state.formData.eventFields"
      v-model:event-filters="state.formData.eventFilters"
      :eventFieldsList="state.formData.eventFieldsData"
      :fieldsList="state.formData.fieldsList"
      :customizable="state.formData.customizable"
      :index="state.formData.index"
      @eventChange="eventChange"
      @addFilter="addFilter"
      @deleteFilter="deleteFilter">
      <template #default v-if="state.disabled"></template>
    </AnalysisIndexItem>
  </div>
</template>
<style lang="scss" scoped>
.index-disabled {
  background-color: #fbfbfb;
  cursor: not-allowed;
  opacity: 0.8;
  pointer-events: none;
  :deep(.el-input__suffix) {
    display: none;
  }
}
</style>
