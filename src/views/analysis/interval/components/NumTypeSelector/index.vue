<!--
 * **************************************************
 * @file
 * @author fengsi<294068744@qq.com>
 * @date 2024-03-05 14:56:33
 * **************************************************
-->

<script setup>
import { reactive, useAttrs } from 'vue'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'NumTypeSelector',
})

const attrs = useAttrs()
const props = defineProps({
  type: {
    type: String,
    default: 'button', // button | dropdown
  },
})

const state = reactive({})
const options = [
  { label: t('analysis.numPeople'), value: 1 },
  { label: t('analysis.interval.numTimes'), value: 2 },
]
</script>

<template>
  <el-radio-group v-if="type === 'button'" v-bind="attrs">
    <el-radio-button
      v-for="item in options"
      :key="item.value"
      :label="item.value"
      :value="item.value"
      >{{ item.label }}</el-radio-button
    >
  </el-radio-group>
  <DropSelectorSingle v-else v-bind="attrs" :data="options" />
</template>

<style scoped lang="scss"></style>
