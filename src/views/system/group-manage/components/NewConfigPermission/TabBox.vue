<template>
  <div class="yf-tab-box">
    <div class="yf-tab-box-header">
      <el-checkbox
        v-model="checkAll"
        :indeterminate="isIndeterminate"
        @change="handleCheckAllChange">
        {{ $t('common.selectAll') }}
        <slot>
          {{ $t('dataManagement.eventProp') }}
        </slot>
      </el-checkbox>
      <div>
        <el-switch v-model="isAddDefault" class="mr10" />
        <span>
          {{ $t('btn.new') }}
          <slot>
            {{ $t('dataManagement.eventProp') }}
          </slot>
          {{ $t('system.projectTeams.autoSelected') }}
        </span>
      </div>
    </div>
    <div class="yf-tab-box-body">
      <el-checkbox-group v-model="checkedIds" @change="handleCheckedChange">
        <el-checkbox
          v-for="val in source"
          :key="val.id"
          :label="val.id"
          :value="val.id">
          <div v-showTips class="yf-checkbox-label">{{ val.name }}</div>
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { isObject } from '@/utils/types'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  source: {
    type: Array,
    default: () => [],
  },
})
const emit = defineEmits(['update:modelValue'])

const result = computed(() => {
  return {
    status: isAddDefault.value,
    ids: checkedIds.value,
  }
})
const isIndeterminate = ref(false)
const checkAll = ref(false)
const checkedIds = ref([])
const isAddDefault = ref(false)

const handleCheckAllChange = (val) => {
  checkedIds.value = val ? props.source.map((el) => el.id) : []
  isIndeterminate.value = false
}
const handleCheckedChange = (value) => {
  const checkedCount = value.length
  checkAll.value = checkedCount === props.source.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < props.source.length
}
const setData = (val) => {
  if (isObject(val) && Array.isArray(val.ids)) {
    isAddDefault.value = val.status
    checkedIds.value = val.ids
    isIndeterminate.value = false
    checkAll.value = false
    if (val.ids.length > 0) {
      nextTick(() => {
        handleCheckedChange(val.ids)
      })
    }
  }
}
watch(
  result,
  (val) => {
    console.log(val)
    emit('update:modelValue', val)
  },
  {
    deep: true,
  }
)
watch(
  () => props.modelValue,
  (val) => {
    setData(val)
  },
  {
    deep: true,
  }
)

defineOptions({
  name: 'TabBox',
})
</script>
<style lang="scss" scoped>
.yf-tab-box {
  .yf-tab-box-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid #dcdfe6;
  }
  .yf-tab-box-body {
    padding-top: 10px;
    height: 463px;
    overflow-y: auto;
    width: 100%;
    > div {
      display: flex;
      flex-wrap: wrap;
    }
    .el-checkbox {
      display: flex;
      align-items: center;
      margin: 0;
      width: 50%;
    }
    :deep(.el-checkbox__label) {
      display: flex;
      align-items: center;
      flex: 1;
      overflow: hidden;
    }
    .yf-checkbox-label {
      width: 100%;
      margin-right: 20px;
    }
  }
}
</style>
