<template>
  <div class="c545e6e fz16 flex-center flex-between">
    <div class="flex-center">
      <div class="c-pointer flex-center" @click="emit('close')">
        <el-icon class="c86919d"><ArrowLeft /></el-icon>
        <span class="ml10">{{ closeTxt || $t('common.back') }}</span>
      </div>
      <template v-if="!$slots.default">
        <template v-if="Array.isArray(title)">
          <template v-for="(item, index) of title" :key="index">
            <i class="ccbd0d6 ml20 mr20">|</i>
            <span>{{ item }}</span>
          </template>
        </template>
        <template v-else>
          <i class="ccbd0d6 ml20 mr20">|</i>
          <span>{{ title }}</span>
        </template>
      </template>

      <slot></slot>
    </div>
    <slot name="right"></slot>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
const props = defineProps({
  closeTxt: {
    type: String,
    default: '',
  },
  title: {
    type: [Array, String],
    default: '',
  },
})
const emit = defineEmits(['close'])
defineOptions({
  name: 'DialogFullScreenHeader',
})
</script>

<style scoped lang="scss"></style>
