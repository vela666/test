<template>
  <div
    @click="show"
    :style="`height:${h}`"
    class="nd-attr-filter-label"
    :class="{
      'is-show-menu': !!state.condition.filters.length,
    }">
    <SvgIcon class="ml5 fz20" name="funnel" />
    {{ $t('user.attributeFilter') }}
  </div>
  <CommonDialog
    @submit="submit"
    width="960px"
    v-model="state.visible"
    :title="$t('user.attributeFilter')">
    <AnalysisGlobalFilter
      :appId="appId"
      :isAnalyze="false"
      title=""
      :limit="propsFilterLimit"
      v-model="state.condition"
      :data="state.propsFilterData"
      @add="addCondition"
      @remove="deleteCondition" />
  </CommonDialog>
</template>

<script setup>
import { reactive, inject, toRef } from 'vue'
import { getFieldList } from '@/api/modules/analysis/common'
import { cloneDeep } from 'lodash-es'
import useOperate from '@/components/PropsFilter/useOperate'
import { ElMessage } from 'element-plus'
const props = defineProps({
  h: {
    type: String,
    default: '32px',
  },
  modelValue: {
    type: Object,
    default() {
      return {}
    },
  },
  reqFilterParam: {
    type: Object,
    default() {
      return {}
    },
  },
  eventIds: {
    type: Array,
    default() {
      return []
    },
  },
})
const emit = defineEmits([
  'update:modelValue',
  'update:reqFilterParam',
  'change',
  'getList',
])

const appId = toRef(inject('appId', sessionStorage.getItem('appId')))

const {
  parseFilterData,
  handleDelConditionData,
  handleAddConditionData,
  getConditionResult,
} = useOperate()
const propsFilterLimit = ['eventField']
const initVal = () => {
  return {
    visible: false,
    condition: {
      relation: 0,
      filters: [],
    },
    propsFilterData: {},
  }
}

const state = reactive(initVal())

const show = () => {
  state.visible = true
  if (props.modelValue) {
    state.condition = cloneDeep(props.modelValue)
  }
  asyncGetFieldList()
}

const asyncGetFieldList = async (eventIds = '') => {
  const { data } = await getFieldList({
    eventIds: props.eventIds.join(','),
    appId: appId.value,
  })
  state.propsFilterData = data
}

// 添加条件
const addCondition = async (filterIndex) => {
  state.condition = handleAddConditionData({
    condition: state.condition,
    noLimit: propsFilterLimit,
    conditionList: state.propsFilterData,
    index: filterIndex,
  })
}

// 删除行
const deleteCondition = (index, subIndex) => {
  state.condition = handleDelConditionData({
    condition: state.condition,
    index,
    subIndex,
  })
}

const resetState = () => {
  Object.assign(state, initVal())
}

const submit = async () => {
  try {
    const data = await getConditionResult({
      condition: state.condition,
      filtsKey: 'propertyFilterParamList',
      relationKey: 'filterParamRelation',
    })
    emit('update:modelValue', cloneDeep(state.condition))
    emit('update:reqFilterParam', data)
    emit('getList')
    state.visible = false
  } catch (e) {
    ElMessage.warning(e)
  }
}
defineExpose({
  resetState,
})
defineOptions({
  name: 'AttrFilter',
})
</script>

<style lang="scss"></style>
<style lang="scss" scoped>
.nd-attr-filter-label {
  position: relative;
  display: flex;
  padding: 10px 20px 10px 10px;
  align-items: center;
  color: var(--eas-text-color-primary);
  font-size: 14px;
  background-color: var(--eas-hover-color-1);
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  border: 1px solid transparent;
  &.is-show-menu {
    color: var(--eas-color-primary);
    border-color: var(--eas-color-primary);
    .svg-icon {
      color: var(--eas-color-primary);
    }
  }
  &:hover {
    @extend .is-show-menu;
  }
}
</style>
