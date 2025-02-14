<script setup>
import { ref, computed, useAttrs } from 'vue'
defineOptions({
  name: 'LabelSelect',
})
const attrs = useAttrs()
const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits(['change', 'visible-change'])
const checkedList = defineModel({ type: Array })
const searchLabel = ref('')

const showLabelOptions = computed(() => {
  return (
    props?.options?.filter((el) =>
      el?.toLowerCase()?.includes(searchLabel.value?.toLowerCase())
    ) || []
  )
})

const clearSearchLabelVal = () => {
  searchLabel.value = ''
  emit('visible-change')
}

const handleChange = (val) => {
  searchLabel.value = ''
  emit('change', val)
}
</script>

<template>
  <el-select
    v-model="checkedList"
    :placeholder="$t('analysis.report.tagFiltering')"
    clearable
    multiple
    collapse-tags
    collapse-tags-tooltip
    @change="handleChange"
    @visible-change="clearSearchLabelVal"
    v-bind="attrs">
    <template #header v-if="options.length > 0">
      <CommonInput
        v-model="searchLabel"
        :desc="$t('analysis.report.searchTagName')" />
    </template>
    <el-option
      v-for="(item, index) in showLabelOptions"
      :key="index"
      :label="item"
      :value="item" />
  </el-select>
</template>

<style scoped lang="scss"></style>
