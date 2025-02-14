<script setup>
import { computed, ref } from 'vue'
defineOptions({
  name: 'AnalysisIndexItem',
})

const props = defineProps({
  // 展示自定义指标还是普通指标的标识
  customizable: {
    type: Boolean,
    default: false,
  },
  // 可以开启事件拆分的事件
  splitEvents: {
    type: Array,
    default: () => [],
  },
  // 多个指标需要序号：如事件分析
  index: {
    type: [Number, String],
    default: -1,
  },
  // 是否在指标中展示事件属性 总次数、xxxx的去重数等
  showEventFields: {
    type: Boolean,
    default: true,
  },
  //指标中的事件属性数据源：总次数、xxxx的去重数
  eventFieldsList: {
    type: Object,
    default: () => ({}),
  },
  //筛选的属性数据源
  fieldsList: {
    type: Object,
    default: () => ({}),
  },
  // 绑定自定义指标的数据
  formula: {
    type: Array,
    default: () => [],
  },
  // 绑定指标中事件的数据
  eventData: {
    type: Object,
    default: () => ({}),
  },
  // 绑定指标中事件的事件属性数据
  eventFields: {
    type: Object,
    default: () => ({}),
  },
  // 绑定当前筛选的数据
  eventFilters: {
    type: Object,
    default: () => ({}),
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
  // 禁用数据标识 eventId
  disabledIds: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'customEventChange',
  'eventChange',
  'addFilter',
  'deleteFilter',
  'update:formula',
  'update:eventData',
  'update:eventFields',
  'update:eventFilters',
])

const formulaCodeRef = ref(null)

const formulaVal = computed({
  get() {
    return props.formula
  },
  set(value) {
    emit('update:formula', value)
  },
})

const eventDataVal = computed({
  get() {
    return props.eventData
  },
  set(value) {
    emit('update:eventData', value)
  },
})

const eventFieldsVal = computed({
  get() {
    return props.eventFields
  },
  set(value) {
    emit('update:eventFields', value)
  },
})

const eventFiltersVal = computed({
  get() {
    return props.eventFilters
  },
  set(value) {
    emit('update:eventFilters', value)
  },
})

const customEventChange = (index, val) => {
  emit('customEventChange', index, val)
}

const eventChange = (index, val) => {
  emit('eventChange', index, val)
}

const addFilter = (index, fIndex) => {
  emit('addFilter', index, fIndex)
}

const deleteFilter = (index, fIndex, subfIndex) => {
  emit('deleteFilter', index, fIndex, subfIndex)
}

const handleShowKeyBord = () => {
  formulaCodeRef.value.showKeybord = true
}

defineExpose({ handleShowKeyBord })
</script>

<template>
  <div class="index-body">
    <FormulaCode
      v-if="customizable"
      v-model="formulaVal"
      :splitEvents="splitEvents"
      :analysisType="analysisType"
      :anyEvent="anyEvent"
      @event-change="(val) => customEventChange(index, val)"
      ref="formulaCodeRef">
      <template #append>
        <slot name="append" />
      </template>
    </FormulaCode>
    <div class="flex-center" v-else>
      <IndexSelect
        :disabledIds="disabledIds"
        :anyEvent="anyEvent"
        v-model="eventDataVal"
        @change="(val) => eventChange(index, val)" />
      <slot name="split"></slot>
      <template v-if="showEventFields">
        <span class="mr8 word__de">{{ $t('common.of') }}</span>
        <PropsCascader :list="eventFieldsList" v-model="eventFieldsVal" />
      </template>
      <slot name="append" />
    </div>
    <PropsFilter
      v-if="eventFiltersVal?.filters?.length"
      :data="fieldsList"
      v-model="eventFiltersVal"
      @add="(fIndex) => addFilter(index, fIndex)"
      @remove="(fIndex, subfIndex) => deleteFilter(index, fIndex, subfIndex)" />
    <template v-if="!Object.keys($slots).includes('default')">
      <el-button type="primary" text class="mt10" @click="addFilter(index)">
        <svg-icon name="funnel-filter" class="fz16 mr3"></svg-icon>
        {{ $t('analysis.addConditions') }}
      </el-button>
    </template>
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
/* .index-body {
  padding-left: 40px;
} */
.word__de {
  display: inline-block;
  line-height: 28px;
  vertical-align: top;
}
.flex-center {
  display: flex;
  align-items: center;
}
</style>
