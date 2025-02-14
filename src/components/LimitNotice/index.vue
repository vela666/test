<script setup>
import { computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
defineOptions({
  name: 'LimitNotice',
})
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: true,
  },
  text: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const val = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})
</script>

<template>
  <div class="flex-center flex-between notice-limit" v-if="val">
    <div class="flex-center">
      <el-icon class="mr10 cff9f24"><InfoFilled /></el-icon>
      <div>{{ text || $t('analysis.dataExcessiveMsg') }}</div>
    </div>
    <svg-icon class="c-pointer" name="close1" @click="val = false" />
  </div>
</template>

<style scoped lang="scss">
.notice-limit {
  padding: 10px;
  border: 1px solid var(--eas-color-warning-light);
  background-color: var(--eas-color-warning-light-1);
  border-radius: 4px;
  color: var(--eas-color-warning);
}
</style>
