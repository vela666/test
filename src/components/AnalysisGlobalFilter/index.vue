<script setup>
import { computed } from 'vue'
import { tableKeysArr } from '@/enumeration'
import { t } from '@/locales/i18n'

/*注意modelValue 的每一项需要id*/
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  // 纯展示
  /*{
    "relation": 0,
    "filts": [
    {
      "filterType": 0,
      "tableType": 1,
      "propertyNameDisplay": "地区",
      "propertyName": "__reg",
      "propertyType": "string",
      "calcuSymbol": "C00",
      "ftv": [
        "美国(US)"
      ]
    },
   ]
  }*/
  exhibit: {
    type: Object,
    default: null,
  },
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  limit: {
    //控制展示哪些属性分类（事件属性、用户属性、用户分群、用户标签）
    type: Array,
    default: () => tableKeysArr,
  },
  title: {
    type: String,
    default: t('analysis.globalFilter'),
  },
  icon: {
    type: String,
    default: 'funnel-filter',
  },
  // src/views/user/components/UserSequence/AttrFilter.vue 等 里传false
  isAnalyze: {
    type: Boolean,
    default: true,
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
  showTemplate: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'remove', 'add', 'change'])
const globalFilters = computed({
  get() {
    return props.exhibit || props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})
const containerCls = computed(() => {
  return [
    props.isAnalyze ? 'analysis-global-filter' : 'nd-kanban-condition-filter',
    props.disabled && 'nd-condition-disabled',
  ]
})
const addGlobalFilter = (index) => {
  emit('add', index)
}

const deleteGlobalFilter = (index, subIndex) => {
  emit('remove', index, subIndex)
}

defineOptions({
  name: 'AnalysisGlobalFilter',
})
</script>

<template>
  <div :class="containerCls">
    <div class="section-label" v-if="title">
      <svg-icon :name="icon" class="mr5"></svg-icon>
      {{ title }}
    </div>
    <div
      :class="['global-filter-container', isAnalyze && 'eas-block-container']">
      <PropsFilter
        v-if="globalFilters?.filters?.length"
        :data="data"
        :appId="appId"
        :showTemplate="showTemplate"
        :queryType="queryType"
        v-model="globalFilters"
        @change="emit('change', $event)"
        @add="(index) => addGlobalFilter(index)"
        @remove="(index, subIndex) => deleteGlobalFilter(index, subIndex)"
        :limit="limit" />
    </div>
    <div class="add-conditions" v-if="!disabled">
      <el-button type="primary" text @click="addGlobalFilter">
        <svg-icon name="funnel-filter" class="fz16 mr3"></svg-icon>
        {{ $t('analysis.addConditions') }}
      </el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.analysis-global-filter {
  .global-filter-container {
    display: flex;
    margin: 0 10px;
    padding: 0 10px;

    &:hover {
      background-color: var(--eas-hover-color);
      border-radius: var(--eas-border-radius-4);
    }
  }

  .section-label {
    width: 100%;
    height: 64px;
    line-height: 64px;
    padding-left: 20px;
    font-size: var(--eas-font-size-medium);
    color: var(--eas-text-color-primary);
    font-weight: bold;
  }

  .add-conditions {
    margin: 4px 20px;
  }
}

.nd-kanban-condition-filter {
  background-color: var(--eas-hover-color);
  border-radius: var(--eas-border-radius-4);
  padding: 10px;

  .global-filter-container {
    display: flex;
    margin-bottom: 10px;
  }
}
</style>
