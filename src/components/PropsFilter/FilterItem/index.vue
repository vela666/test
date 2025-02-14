<script setup>
import { computed, shallowRef, ref, watch, toRef, useAttrs } from 'vue'
import { propsConfig, tableKeysArr, tableTypeArr } from '@/enumeration'
import { getFieldValue } from '@/api/modules/analysis/common.js'
import { getTableType } from '@/utils/dataProcessing'
import { isObject } from 'lodash-es'

defineOptions({
  name: 'FilterItem',
  inheritAttrs: false,
})

const attrs = useAttrs()
const propsData = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  data: {
    type: Object,
    require: true,
  },
  appId: {
    type: [String, Number],
    default: null,
  },
  // 1 根据应用ID查询 2 不根据应用ID查询
  queryType: {
    type: [String, Number],
    default: 1,
  },
})
const emit = defineEmits(['change', 'update:modelValue'])

const config = computed(() => {
  return propsData.data?.config || propsConfig
})
const source = computed(() => {
  const temp = {}
  if (isObject(propsData?.data)) {
    Object.keys(propsData.data).forEach((item) => {
      if (tableKeysArr.includes(item)) {
        temp[item] = propsData.data[item]
      }
    })
  }
  return temp
})

const mVal = toRef(propsData, 'modelValue')
const initProps = {
  fEn: mVal.value?.fEn,
  tableType: mVal.value?.tableType,
  fType: mVal.value?.fType,
  parentId: mVal.value?.parentId,
  name: mVal.value?.fZh || mVal.value?.name,
  customTableName: mVal.value?.customTableName,
  customTableId: mVal.value?.customTableId,
}
// 选择的属性
const props = shallowRef()
props.value = { ...initProps }

const initState = () => ({
  id: '',
  equation: '',
  timeRelation: '',
  timeUnit: '',
  singleValue: '',
  before: 0,
  after: 1,
  selected: '',
  selectedList: [],
  datetimeVal: '',
  datetimerangeval: [],
})

const state = ref({ ...initState(), ...initProps })
for (const key in state.value) {
  // 需要注意数值类型为0的情况
  if (
    propsData.modelValue?.[key] !== null &&
    propsData.modelValue?.[key] !== undefined &&
    propsData.modelValue?.[key] !== ''
  ) {
    state.value[key] = propsData.modelValue[key]
  }
}

const isInitProp = ref(true)
const needSetEquation = ref(true)
if (propsData.modelValue?.equation !== undefined) {
  needSetEquation.value = false
  isInitProp.value = false
}

// 更新属性的（多语言）显示名
const updatePropsDisplayName = () => {
  if (Object.keys(source.value).length && Object.keys(state.value).length) {
    const label = tableTypeArr[state.value.tableType]
    const data = source.value[label]
    if (Array.isArray(data)) {
      let temp = null
      if (label === 'customTableList') {
        const customRes = data.find(
          (e) => e.fEn === state.value.customTableName
        )
        temp = (
          Array.isArray(customRes?.fieldInfoList) ? customRes.fieldInfoList : []
        ).find((e) => e.fEn === state.value.fEn)
      } else {
        temp = data.find((e) => e.fEn === state.value.fEn)
      }
      if (temp) {
        state.value.name = temp.fZh
      }
    }
  }
}

watch(
  () => source.value,
  () => {
    updatePropsDisplayName()
  },
  {
    immediate: true,
  }
)

watch(
  () => propsData.modelValue,
  (val) => {
    state.value = val
    updatePropsDisplayName()
  },
  { deep: true, immediate: true }
)
watch(
  state,
  (val) => {
    emit('update:modelValue', val)
  },
  { deep: true }
)

// 比较关系列表
const typeList = computed(() => {
  let res = []
  if (props.value?.fType) {
    const temp = config.value[props.value.fType]
    res = Object.keys(temp ?? {}).map((el) => ({ value: el, label: temp[el] }))
  }
  return res
})
// 比较关系 大于、小于、等于...
const equationName = computed(() => {
  let label = ''
  if (state.value.equation) {
    const temp = config.value[props.value?.fType]
    if (temp) label = temp[state.value.equation]
  }
  return label
})

const timeEquationList = computed(() => {
  let res = []
  const temp = config.value[state.value.equation]
  if (temp) {
    res = Object.keys(temp ?? {}).map((el) => ({ value: el, label: temp[el] }))
  }
  return res
})
// 比较关系切换
const equationChange = (item) => {
  if (state.value.equation === item.value) return
  state.value.equation = item.value
}
// watch 选择的属性
watch(
  props,
  (val) => {
    if (needSetEquation.value === true) {
      if (isInitProp.value) {
        let key = ''
        if (val?.fType) {
          const temp = config.value[val.fType]
          if (temp) key = Object.keys(temp ?? {})[0] ?? ''
        }
        state.value.equation = key
      }
    } else {
      needSetEquation.value = true
    }
  },
  {
    immediate: true,
  }
)
// 处理fType为 datetime, timestamp相关
const timeRelationName = computed(() => {
  let label = ''
  if (state.value.timeRelation) {
    const temp = config.value[state.value.equation]
    if (temp) label = temp[state.value.timeRelation]
  }
  return label
})
const timeRelationChange = (item) => {
  if (state.value.timeRelation === item.value) return
  state.value.timeRelation = item.value
}

const timeUnitName = computed(() => {
  let label = ''
  if (state.value.timeUnit) {
    const temp = config.value['timeunit']
    if (temp) label = temp[state.value.timeUnit]
  }
  return label
})
const timeunitList = Object.keys(config.value['timeunit'] ?? {}).map((el) => ({
  value: el,
  label: config.value['timeunit'][el],
}))
const timeunitChange = (item) => {
  if (state.value.timeUnit === item.value) return
  state.value.timeUnit = item.value
}
/**
 * 1、[int, double, enum, string] && [C00, C01] =>  下拉选择（多选）
 * 2、[int, double] && [C02, C03, C19, C20] => 输入框
 * 3、[int, double] && [C06] => A值与B值之间
 * 4、[string] && [C07, C08] => 下拉框（单选）
 * 5、[datetime, timestamp] && [C02, C03] => 日期时间选择
 * 6、[datetime, timestamp] && [C09] => 日期时间范围选择
 * 7、[datetime, timestamp] && [C13] =>  timeRelation = before  xxx天前; timeRelation = between => xxx 到 xxx 天前
 * 8、[datetime, timestamp] && [C14] => timeRelation = that_monty、that_day、that_week; timeRelation = between => 区间在 xxx 到 xxx => timeUnit = day、hour、minute;
 */
const showType = computed(() => {
  let type = 0
  if (
    ['int', 'double', 'enum', 'string'].includes(props.value?.fType) &&
    ['C00', 'C01'].includes(state.value.equation)
  ) {
    type = 1
  } else if (
    ['int', 'double'].includes(props.value?.fType) &&
    ['C02', 'C03', 'C19', 'C20'].includes(state.value.equation)
  ) {
    type = 2
  } else if (
    ['int', 'double'].includes(props.value?.fType) &&
    ['C06'].includes(state.value.equation)
  ) {
    type = 3
  } else if (
    ['string'].includes(props.value?.fType) &&
    ['C07', 'C08'].includes(state.value.equation)
  ) {
    type = 4
  } else if (
    ['datetime', 'timestamp'].includes(props.value?.fType) &&
    ['C02', 'C03'].includes(state.value.equation)
  ) {
    type = 5
  } else if (
    ['datetime', 'timestamp'].includes(props.value?.fType) &&
    ['C09'].includes(state.value.equation)
  ) {
    type = 6
  } else if (
    ['datetime', 'timestamp'].includes(props.value?.fType) &&
    ['C13'].includes(state.value.equation)
  ) {
    type = 7
  } else if (
    ['datetime', 'timestamp'].includes(props.value?.fType) &&
    ['C14'].includes(state.value.equation)
  ) {
    type = 8
  }
  return type
})
const options = ref([])

// 监测equation清除选择(输入)的值
watch(
  () => state.value.equation,
  (val, old) => {
    if (['C00', 'C01'].includes(old)) {
      state.value.selectedList = []
    } else if (['C07', 'C08'].includes(old)) {
      state.value.selected = ''
    } else if (['C02', 'C03', 'C19', 'C20'].includes(old)) {
      state.value.singleValue = ''
      state.value.datetimeVal = ''
    } else if (old === 'C06') {
      state.value.before = 0
      state.value.after = 1
    } else if (old === 'C09') {
      state.value.datetimerangeval = []
    }
    if (['C13', 'C14'].includes(val)) {
      state.value.timeRelation = timeEquationList?.value?.[0]?.value
    }
  }
)
// 监测 timeRelation
watch(
  () => state.value.timeRelation,
  (val, old) => {
    if (old === 'between') {
      state.value.before = 0
      state.value.after = 1
    } else if (old === 'before') {
      state.value.before = 0
    }
    if (state.value.equation === 'C14' && val === 'between') {
      state.value.timeUnit = timeunitList?.[0]?.value
    }
  }
)
//监测 timeUnit
watch(
  () => state.value.timeUnit,
  () => {
    state.value.before = 0
    state.value.after = 1
  }
)
watch(
  () => state.value.before,
  (val) => {
    if (
      state.value.timeRelation == 'between' ||
      state.value.equation === 'C06'
    ) {
      if (state.value.before > state.value.after) {
        state.value.after = val + 1
      }
    }
  }
)
watch(
  () => state.value.after,
  (val) => {
    if (
      state.value.timeRelation == 'between' ||
      state.value.equation === 'C06'
    ) {
      if (state.value.before > val) {
        state.value.after = state.value.before + 1
      }
    }
  }
)

// 选中的属性改变
const propsChange = (val) => {
  isInitProp.value = true
  state.value = {
    ...initState(),
    id: state.value.id,
    fEn: val?.fEn,
    tableType: val?.tableType,
    fType: val?.fType,
    parentId: val?.fieldId,
    name: val?.fZh,
    customTableName: val?.customTableName,
    customTableId: val?.customTableId,
  }
}

// 属性值下拉选择选项
const fetchFieldValueList = async (val) => {
  if (val) {
    const res = await getFieldValue({
      ...(propsData.appId && {
        appId: propsData.appId,
      }),
      queryType: propsData.queryType,
      showPreset: true,
      fEn: state.value.fEn,
      tableType: state.value.tableType,
      type: state.value.fType,
      customTableName: state.value?.customTableName,
      customTableId: state.value?.customTableId,
    })
    if (res.code === 200 && Array.isArray(res.data)) {
      options.value = res.data.map((item) => ({ label: item, value: item }))
    }
  } else {
    options.value = []
  }
}

const defaultTime = [
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59),
]

const disabledDate = (date) =>
  date.getTime() > new Date().setHours(23, 59, 59, 999)

const defaultVal = {
  before: 0,
  after: 1,
}

const blurHandle = (e, type) => {
  if (!e.target.value) {
    if (['before', 'after'].includes(type)) {
      state.value[type] = defaultVal[type]
    }
  }
}
</script>

<template>
  <div class="eas-filter-item">
    <PropSelect
      :appId="propsData.appId"
      :list="source"
      :queryType="queryType"
      v-model="props"
      @change="propsChange"
      class="eas-filter-container"
      v-bind="attrs" />
    <el-dropdown
      trigger="click"
      @command="equationChange"
      class="eas-filter-container">
      <div class="eas-drop-box">{{ equationName }}</div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="item in typeList"
            :key="item.value"
            :command="item"
            :class="{ active: item.value === state.equation }">
            {{ item.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-select
      v-model="state.selectedList"
      multiple
      filterable
      allow-create
      :reserve-keyword="false"
      style="width: 240px"
      class="eas-filter-container"
      v-if="showType == 1"
      @visible-change="fetchFieldValueList">
      <el-option
        v-for="item in options"
        :key="`multiple_${item.value}`"
        :label="item.label"
        :value="item.value" />
    </el-select>
    <el-input
      v-model="state.singleValue"
      v-else-if="showType == 2"
      style="width: 240px"
      class="eas-filter-container" />
    <template v-else-if="showType == 3">
      <el-input-number
        controls-position="right"
        style="width: 80px"
        class="eas-filter-container"
        :value-on-clear="0"
        v-model="state.before"
        @blur="(e) => blurHandle(e, 'before')" />
      <span class="filter-text eas-filter-container">{{ $t('user.and') }}</span>
      <el-input-number
        controls-position="right"
        style="width: 80px"
        class="eas-filter-container"
        :value-on-clear="1"
        v-model="state.after"
        @blur="(e) => blurHandle(e, 'after')" />
      <span class="filter-text eas-filter-container">{{
        $t('user.between')
      }}</span>
    </template>
    <el-select
      v-else-if="showType == 4"
      v-model="state.selected"
      filterable
      allow-create
      class="eas-filter-container"
      style="width: 240px"
      @visible-change="fetchFieldValueList">
      <el-option
        v-for="item in options"
        :key="`single_${item.value}`"
        :label="item.label"
        :value="item.value" />
    </el-select>
    <el-date-picker
      v-model="state.datetimeVal"
      v-else-if="showType == 5"
      value-format="YYYY-MM-DD HH:mm:ss"
      popper-class="eas-date-picker"
      class="eas-filter-container eas-date-picker-input__wrapper"
      type="datetime" />
    <el-date-picker
      v-if="showType == 6"
      v-model="state.datetimerangeval"
      popper-class="eas-date-picker"
      class="eas-filter-container eas-date-picker-input__wrapper"
      type="datetimerange"
      :range-separator="$t('common.to')"
      value-format="YYYY-MM-DD HH:mm:ss"
      :start-placeholder="$t('common.startDate')"
      :end-placeholder="$t('common.endDate')"
      :default-time="defaultTime"
      :disabled-date="disabledDate" />
    <template v-else-if="[7, 8].includes(showType)">
      <span class="filter-text eas-filter-container">{{ $t('user.in') }}</span>
      <el-dropdown
        trigger="click"
        @command="timeRelationChange"
        class="eas-filter-container">
        <div class="eas-drop-box">{{ timeRelationName }}</div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="item in timeEquationList"
              :key="item.value"
              :command="item"
              :class="{ active: item.value === state.timeRelation }">
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <template v-if="showType == 7">
        <el-input-number
          controls-position="right"
          style="width: 80px"
          class="eas-filter-container"
          :value-on-clear="0"
          v-model="state.before"
          @blur="(e) => blurHandle(e, 'before')" />
        <span
          class="filter-text eas-filter-container"
          v-if="state.timeRelation == 'before'">
          {{ $t('user.daysAgo') }}
        </span>
        <template v-else>
          <span class="filter-text eas-filter-container">
            {{ $t('analysis.funnel.to') }}
          </span>
          <el-input-number
            controls-position="right"
            style="width: 80px"
            class="eas-filter-container"
            :value-on-clear="1"
            v-model="state.after"
            @blur="(e) => blurHandle(e, 'after')" />
          <span class="filter-text eas-filter-container">
            {{ $t('dateRangeSelect.day') }}
          </span>
        </template>
      </template>
      <template v-else-if="showType == 8 && state.timeRelation == 'between'">
        <el-input-number
          controls-position="right"
          style="width: 80px"
          class="eas-filter-container"
          :value-on-clear="0"
          v-model="state.before"
          @blur="(e) => blurHandle(e, 'before')" />
        <span class="filter-text eas-filter-container">{{
          $t('analysis.funnel.to')
        }}</span>
        <el-input-number
          controls-position="right"
          style="width: 80px"
          class="eas-filter-container"
          :value-on-clear="1"
          v-model="state.after"
          @blur="(e) => blurHandle(e, 'after')" />
        <el-dropdown
          trigger="click"
          @command="timeunitChange"
          class="eas-filter-container">
          <div class="eas-drop-box">{{ timeUnitName }}</div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in timeunitList"
                :key="item.value"
                :command="item"
                :class="{ active: item.value === state.timeUnit }">
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </template>
  </div>
</template>

<style scoped lang="scss">
.eas-filter-item {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  white-space: normal;
}
:deep(.el-dropdown-menu__item) {
  &.active {
    color: var(--eas-color-primary);
  }
}
.filter-text {
  padding: 0px 8px;
}
.eas-filter-container {
  margin-right: 8px;
  padding: 2px 0;
  &.el-select,
  &.el-input {
    :deep(.el-input__inner) {
      --el-input-height: 28px;
    }
    :deep(.el-select__wrapper) {
      padding: 2px 12px;
      min-height: auto;
    }
    :deep(.el-input__wrapper) {
      border-radius: var(--eas-border-radius);
    }
  }
  &.el-select {
    :deep(.el-tag) {
      height: 22px;
      border-radius: var(--eas-border-radius);
    }
  }
  &.el-input-number {
    :deep(.el-input-number__decrease),
    :deep(.el-input-number__increase) {
      --el-input-number-controls-height: 13px;
      width: 22px;
      opacity: 0;
    }
    :deep(.el-input-number__increase) {
      top: 3px;
    }
    :deep(.el-input-number__decrease) {
      bottom: 3px;
    }
    :deep(.el-input) {
      --el-input-height: 28px;
    }
    :deep(.el-input__wrapper) {
      padding-left: 5px;
      padding-right: 22px;
      border-radius: var(--eas-border-radius);
    }
    &:hover {
      :deep(.el-input-number__increase),
      :deep(.el-input-number__decrease) {
        opacity: 1;
      }
    }
  }
}
</style>
