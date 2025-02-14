<template>
  <el-select
    placeholder="选择企业"
    v-model="value"
    class="w210"
    multiple
    filterable
    clearable
    collapse-tags
    collapse-tags-tooltip
    :max-collapse-tags="1">
    <el-option
      v-for="item in companyList"
      :key="item.code"
      :label="item.name"
      :value="item.code" />
  </el-select>
</template>

<script setup>
import { markRaw, onActivated, ref } from 'vue'
import { asyncGetCompanyList } from '@/api/modules/operation-analysis.js'
import { domesticOverseasMark } from '@/utils/domesticOverseas.js'

const value = defineModel({
  type: Array,
  default: () => [],
})
const companyList = ref([])

const getCompanyList = async () => {
  const { data } = await asyncGetCompanyList({
    supportVersion: [domesticOverseasMark(), 3],
  })
  companyList.value = markRaw(data)
}
getCompanyList()

defineOptions({
  name: 'SelectCompany',
})

onActivated(() => {
  console.log('Operation-analysis')
})
</script>

<style scoped lang="scss"></style>
