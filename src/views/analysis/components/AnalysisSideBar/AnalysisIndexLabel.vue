<script setup>
import { ref, reactive, onMounted } from 'vue'
defineOptions({
  name: 'AnalysisIndexLabel',
})
const props = defineProps({
  label: {
    type: [String, Number],
    default: '',
    required: true,
  },
  tip: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="analysis-index-label">
    <div class="label__text">
      {{ label }}
      <el-tooltip :content="tip" placement="right" v-if="tip">
        <svg-icon name="warning2" class="c86919d" />
      </el-tooltip>
    </div>

    <div><slot name="btn"></slot></div>
  </div>
</template>

<style scoped lang="scss">
.analysis-index-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .label__text {
    height: 19px;
    line-height: 19px;
    font-size: var(--eas-font-size-base);
    font-weight: bold;
    color: var(--eas-text-color-primary);
  }
}
</style>
