<script setup>
import { watch, computed, useAttrs } from 'vue'
import { debounce } from 'lodash-es'
import FilterItem from './FilterItem/index.vue'
import RuleAndOrSelect from './RuleAndOrSelect.vue'
import ConditionTemplate from './ConditionTemplate.vue'

defineOptions({
  name: 'PropsFilter',
})

const attrs = useAttrs()
/* modelValue 数据中每一项要加 id（使用uuid生成）*/
const props = defineProps({
  modelValue: {
    type: Object,
    require: true,
  },
  data: {
    type: Object,
    require: true,
  },
  // 且或判断长度
  lineNum: {
    type: [String, Number],
    default: 0,
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
  required: {
    type: Boolean,
    default: false,
  },
  showTemplate: {
    type: Boolean,
    default: true,
  },
  operation: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits(['add', 'remove', 'change', 'update:modelValue'])
/**
 * @description 添加筛选项
 * @param {*} index 当前项索引
 * @param {*} subIndex 子筛选项索引
 */
const addItem = (index, subIndex) => {
  emit('add', index, subIndex)
}

/**
 * @description 移除指定筛选项的索引
 * @param {*} index 当前项索引
 * @param {*} subIndex 子筛选项索引
 */
const removeItem = (index, subIndex) => {
  emit('remove', index, subIndex)
}

const state = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})
watch(
  () => state.value,
  debounce((val) => {
    emit('change', val)
    // emit('update:modelValue', val)
  }, 100)
)
const isRequired = computed(() => {
  let flag = props.required

  if (props.required) {
    flag = state.value.filters.length === 1
  }

  return flag
})

const updFilter = (data, index) => {
  state.value.filters[index] = data
}
</script>

<template>
  <div class="props-filter">
    <RuleAndOrSelect
      v-model="state.relation"
      :addOrShow="state?.filters?.length > 1"
      :containerShow="state?.filters?.length > +lineNum" />
    <div class="props-filter-content">
      <div
        class="filter-content-item"
        v-for="(item, index) in state.filters"
        :key="item.id">
        <template v-if="Array.isArray(item.filters) && item.filters.length > 0">
          <PropsFilter
            :data="data"
            class="is-compound"
            v-model="state.filters[index]"
            v-bind="attrs"
            :showTemplate="showTemplate"
            :appId="appId"
            :queryType="queryType"
            :lineNum="lineNum"
            @add="(subIndex) => addItem(index, subIndex)"
            @remove="(subIndex) => removeItem(index, subIndex)"
            :requried="isRequired" />
        </template>
        <template v-else>
          <FilterItem
            :queryType="queryType"
            :appId="appId"
            v-model="state.filters[index]"
            :data="data"
            v-bind="attrs" />
          <div class="filter-operation" v-if="operation">
            <el-tooltip
              effect="dark"
              :content="$t('analysis.component.addParallelConditions')"
              placement="top"
              :hide-after="0">
              <svg-icon
                name="funnel"
                class="eas-filter-icon"
                @click="addItem(index)" />
            </el-tooltip>
            <ConditionTemplate
              @updFilter="(filterData) => updFilter(filterData, index)"
              v-if="showTemplate"
              :index="index"
              :appId="appId"
              :data="data"
              :item="state.filters" />
            <el-tooltip
              effect="dark"
              :content="$t('analysis.component.deleteCondition')"
              placement="top"
              :hide-after="0">
              <svg-icon
                name="delete"
                :class="{ 'is-required': isRequired }"
                class="eas-filter-icon"
                @click="removeItem(index)" />
            </el-tooltip>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.props-filter {
  display: flex;
  color: var(--eas-text-color-primary);
  &:not(.is-compound) {
    margin: 10px 0px;
  }
}

.filter-content-item {
  display: flex;
  align-items: center;
  &:not(:last-child) {
    margin-bottom: 10px;
  }
  &:hover {
    & > .filter-operation {
      visibility: visible;
      .is-required {
        visibility: hidden;
      }
    }
  }
}
.filter-operation {
  display: flex;
  align-items: center;
  visibility: hidden;
}
.eas-filter-icon {
  width: 28px;
  height: 28px;
  color: var(--eas-text-color-light);
  cursor: pointer;
  & + & {
    margin-left: 5px;
  }
  &:hover {
    color: var(--eas-color-primary);
    background-color: var(--eas-border-color);
  }
}
</style>
