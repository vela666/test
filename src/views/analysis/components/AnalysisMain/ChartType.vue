<template>
  <el-radio-group
    v-model="chartType"
    class="no-bg-radio-group"
    @change="(val) => emit('change', val)">
    <el-tooltip
      effect="dark"
      :content="item.title || item.label"
      placement="top"
      :hide-after="0"
      v-for="item in data"
      :key="`chart_icon_${item.value}`">
      <el-radio-button
        :label="item.value"
        :value="item.value"
        :disabled="item.disabled">
        <svg-icon :name="item.icon" class="fz18"></svg-icon>
      </el-radio-button>
    </el-tooltip>
  </el-radio-group>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  data: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const chartType = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>
