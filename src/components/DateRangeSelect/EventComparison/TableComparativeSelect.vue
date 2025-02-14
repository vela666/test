<template>
  <!--  对比阶段 -->
  <el-select
    :class="{ 'no-border': !showBorder }"
    :style="`width:${
      versus[selectedStageTableIndex - 1] &&
      getActualWidthOfChars(
        `阶段：${versus[selectedStageTableIndex - 1].mainName}`
      ) + 60
    }px`"
    @change="(val) => emit('change', val)"
    v-model="selectedStageTableIndex"
    placeholder="请选择">
    <el-option
      v-for="(item, index) of versus"
      :key="`versus` + index"
      :label="`阶段：${item.mainName}`"
      :value="index + 1">
      <span>
        {{ item.mainName }}
      </span>
    </el-option>
  </el-select>
</template>

<script setup>
import { computed } from 'vue'
import { getActualWidthOfChars } from '@/utils'
/*
<!-- 表格的 对比阶段选择 -->
<TableComparativeSelect
    v-show="versus.length > 1"
    v-model="selectedStageTableIndex"
    v-model:versus="versus"
@change="changeTableType"
    />
*/
const props = defineProps({
  showBorder: {
    type: Boolean,
    default: true,
  },
  versus: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number],
    default: 1,
  },
})
const emit = defineEmits(['update:modelValue', 'update:versus', 'change'])
const selectedStageTableIndex = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
    emit(
      'update:versus',
      props.versus.map((item, index) => {
        return {
          ...item,
          tableCurrentSelectionStage: index === val - 1,
        }
      })
    )
  },
})
defineOptions({
  name: 'TableComparativeSelect',
})
</script>

<style scoped lang="scss">
.no-border {
  :deep(.el-input__inner) {
    border: none;
  }
}
</style>
