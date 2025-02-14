<script setup>
import { cloneDeep, omit } from 'lodash-es'
import { ref, computed, watch, provide } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { data as listData } from '@/components/PropsFilter/FilterItem/props.json'
import { data as testData } from '@/components/PropsCascader/cascader.json'
import { ElMessage } from 'element-plus'
import useOperate from '@/components/PropsFilter/useOperate'
import { getTableType } from '@/utils/dataProcessing'
import { tableKeysArr } from '@/enumeration'

const {
  parseFilterData,
  parseFiltersFromRes,
  handleDelConditionData,
  handleAddConditionData,
} = useOperate()

import { getEventFields, getFieldList } from '@/api/modules/analysis/common.js'
import useEventStore from '@/store/modules/event.js'

/**
 数据结构：
  {
    relation: 0,
    filters:[
      {xxx:xxx, xx:xxx, ...},
      {xxx:xxx, xx:xxx, ...},
      {
        relation: 1,
        filters: [
          {xxx:xxx, xx:xxx, ...},
          {xxx:xxx, xx:xxx, ...}
        ]
      }
    ]
  }
 */
const testFilters = {
  filts: [
    {
      filterType: 1,
      filts: [
        {
          propertyName: '__reg',
          propertyNameDisplay: '地区',
          propertyType: 'string',
          calcuSymbol: 'C00',
          ftv: ['美国(US)'],
          timeRelative: '',
          timeUnit: '',
          tableType: 1,
          parentId: '',
        },
        {
          propertyName: '__dpi_w',
          propertyNameDisplay: '设备屏幕宽度',
          propertyType: 'int',
          calcuSymbol: 'C03',
          ftv: ['777'],
          timeRelative: '',
          timeUnit: '',
          tableType: 1,
          parentId: '',
        },
      ],
      relation: 0,
    },
    {
      propertyName: '__device_vender',
      propertyNameDisplay: '设备厂商',
      propertyType: 'string',
      calcuSymbol: 'C05',
      ftv: [],
      timeRelative: '',
      timeUnit: '',
      tableType: 1,
      parentId: '',
    },
    {
      propertyName: '__first_start_time',
      propertyNameDisplay: '首次启动时间(事件)',
      propertyType: 'timestamp',
      calcuSymbol: 'C09',
      ftv: ['2023-11-01 00:00:00', '2023-11-02 23:59:59'],
      timeRelative: '',
      timeUnit: '',
      tableType: 1,
      parentId: '',
    },
  ],
  relation: 0,
}
console.log('回显====================================')
console.log(parseFiltersFromRes(testFilters))
console.log('====================================')
const ecentStore = useEventStore()
const eventsData = computed(() => ecentStore.eventGroups)
const indexData = ref({})
for (const item of eventsData.value) {
  if (Array.isArray(item.eventList) && item.eventList?.[0]?.eventId) {
    indexData.value = { ...item.eventList[0] }
    break
  }
}
const limit = tableKeysArr

// for (let key in temp.filters) {
//   temp.filters[key]['id'] = uuidv4()
// }
const datas = ref({
  relation: 0,
  filters: [],
})

// 添加一项
const addFilter = (index) => {
  datas.value = handleAddConditionData({
    condition: datas.value,
    noLimit: limit,
    conditionList: fieldsList.value,
    index,
  })
}

// 删除一项
const deleteFilter = (index, subIndex) => {
  datas.value = handleDelConditionData({
    condition: datas.value,
    index,
    subIndex,
  })
}

const checkData = () => {
  const res = parseFilterData(datas.value)
  if (res === false) {
    ElMessage({
      message: '筛选条件参数错误',
      type: 'warning',
    })
  }
  console.log(res, 'res')
}
// const cascaderVal = ref({
//   val: ['activity_rounds', 'A05'],
//   type: 'double',
//   parentId: '',
// })
const cascaderVal = ref({})
watch(
  indexData,
  async (val) => {
    const { eventId } = val
    if (!eventId) return
    cascaderVal.value = {}
    const res = await getEventFields({ eventId }) //analysisType: 1
    if (res.code === 200 && res.data) {
      eventFielList.value = res.data
    }
    const res2 = await getFieldList({ eventIds: eventId })
    if (res2.code === 200 && res2.data) {
      fieldsList.value = res2.data
    }
  },
  {
    immediate: true,
  }
)
// const eventChange = async (data) => {
//   cascaderVal.value = {}
//   const res = await getEventFields({ eventId: data.eventId }) //analysisType: 1
//   if (res.code === 200 && res.data) {
//     eventFielList.value = res.data
//   }
//   const res2 = await getFieldList({ eventIds: data.eventId })
//   if (res2.code === 200 && res2.data) {
//     fieldsList.value = res2.data
//   }
// }

const eventFielList = ref()
const fieldsList = ref({})
</script>
<template>
  <div class="title">
    <div class="home-content">
      <div>
        <!-- <IndexSelect v-model="indexData" @change="eventChange" /> -->
        <IndexSelect v-model="indexData" />
        <PropsCascader :list="eventFielList" v-model="cascaderVal" />
      </div>
      <PropsFilter
        :data="fieldsList"
        v-model="datas"
        @add="addFilter"
        @remove="deleteFilter"
        :limit="limit" />
      <div>
        <el-button type="primary" size="small" @click="addFilter()"
          >添加</el-button
        >
        <el-button type="primary" size="small" @click="checkData"
          >检测
        </el-button>
      </div>
      <FormulaCode />
    </div>
  </div>
  <ConsolePanel
    :data="{
      indexData,
      cascaderVal,
      datas,
    }" />
</template>
<style lang="scss" scoped>
.title {
  //user-select: none;
  color: var(--eas-color-primary);
  padding: 20px;
}
.home-content {
  width: 580px;
}
.demo {
  color: var(--eas-text-color-2);
}
</style>
