<script setup>
import { computed, onBeforeUnmount } from 'vue'
defineOptions({
  name: 'SplitBtn',
})
const props = defineProps({
  modelValue: {
    type: Number,
    default: 1,
    require: true,
  },
})
const emit = defineEmits(['update:modelValue'])
const val = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})
if (props.modelValue === 0) {
  val.value = 1
}
const switchMode = () => {
  val.value = props.modelValue === 2 ? 1 : 2
}
onBeforeUnmount(() => {
  val.value = 0
})
</script>

<template>
  <el-tooltip effect="dark" placement="top" :hide-after="0">
    <template #content>{{
      val === 1
        ? $t('analysis.deactivateEventSplit')
        : $t('analysis.activateEventSplit')
    }}</template>
    <div
      class="split-icon-btn"
      @click.stop="switchMode"
      :class="[{ 'is-active': val === 1 }]">
      <svg-icon name="event-split" class="fz16"></svg-icon>
    </div>
  </el-tooltip>
</template>

<style scoped lang="scss"></style>
