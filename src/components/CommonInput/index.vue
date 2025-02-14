<template>
  <el-input
    @blur="inputBlur"
    :clearable="clearable"
    v-model="value"
    :placeholder="desc || $t('common.pleaseEnter')"
    v-bind="attrs">
    <template #prefix v-if="prefixSlot">
      <SvgIcon class="c86919d" name="search" />
    </template>
    <template #suffix>
      <slot name="suffix"></slot>
    </template>
  </el-input>
</template>

<script setup>
import { computed, useAttrs } from 'vue'

const attrs = useAttrs()
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  prefixSlot: {
    type: Boolean,
    default: true,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  desc: {
    type: String,
    default: '',
  },
  trimSpace: {
    type: Boolean,
    default: true,
  },
  // 去除全部空格
  trimAllSpace: {
    type: Boolean,
    default: false,
  },
  // 不需要去除空格
  notTrimSpace: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:modelValue'])
const value = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const inputBlur = () => {
  if (props.notTrimSpace) return
  if (props.trimAllSpace) {
    value.value = (value.value + '').replace(/\s/g, '')
    return
  }
  if (props.trimSpace) {
    value.value = (value.value + '').trim()
  }
}

defineOptions({
  name: 'CommonInput',
})
</script>
