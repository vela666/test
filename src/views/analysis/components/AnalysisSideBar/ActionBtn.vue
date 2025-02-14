<template>
  <template v-if="type === 'btn'">
    <el-button type="primary" text class="mt5 mb5">
      <svg-icon :name="icon" class="fz16 mr3"></svg-icon>
      {{ label }}
    </el-button>
  </template>
  <template v-else>
    <el-tooltip :content="content" placement="top">
      <div class="analysis-icon__btn analysis-item-btn" v-bind="attrs">
        <svg-icon :name="icon"></svg-icon>
      </div>
    </el-tooltip>
  </template>
</template>

<script setup>
import { useAttrs } from 'vue'

const attrs = useAttrs()
defineProps({
  label: {
    type: [String, Number],
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'btn',
  },
  content: {
    type: [String, Number],
    default: '',
  },
})
</script>

<style lang="scss" scoped></style>
