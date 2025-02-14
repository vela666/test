<template>
  <el-select
    popper-class="nd-field-select"
    v-model="currentSelect"
    :placeholder="$t('common.pleaseSelect')">
    <el-option
      v-for="item of selectData"
      :key="item.column"
      :disabled="attrFieldList.includes(item.column)"
      :label="item.column"
      :value="item.column">
      <div class="flex-column">
        <span>{{ item.column }}</span>
        <div class="flex-center">
          <span class="cff9f24 mr5" v-if="item.primaryKeyOrNot">
            {{ $t('dataManagement.customTable.primaryKey') }}
          </span>
          <span class="c86919d"> {{ item.columnDisplay }}</span>
        </div>
      </div>
    </el-option>
  </el-select>
</template>

<script setup>
import { computed } from 'vue'
// 不允许重复选择
const props = defineProps({
  selectedFields: {
    type: Array,
    default: () => [],
  },
  // 数据源
  selectData: {
    type: Array,
    default: () => [],
  },
})

const currentSelect = defineModel({
  type: [String, Number],
  default: '',
})

// 下拉互斥 防止重复选择
const attrFieldList = computed(() => {
  // 排除当前的
  return props.selectedFields.filter((item) => item !== currentSelect.value)
})

defineOptions({
  name: 'FieldSelect',
})
</script>
<style lang="scss">
.nd-field-select {
  .el-select-dropdown__item {
    height: auto;
    min-height: 34px;
    padding-top: 5px;
    padding-bottom: 5px;
  }
}
</style>
