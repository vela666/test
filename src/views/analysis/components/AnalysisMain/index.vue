<template>
  <div v-show="show" class="analysis-main__body">
    <el-scrollbar class="pr20">
      <div
        class="analysis-main__header flex-center flex-between mb20"
        v-if="status === 1 || showHeader">
        <slot name="header" />
      </div>
      <template v-if="status === 1">
        <div
          class="analysis-main__table mb20"
          v-if="Object.keys($slots).includes('chart')">
          <slot name="chart" />
        </div>
        <slot name="table" />
      </template>
      <empty
        class="analysis-empty"
        v-if="status !== 1"
        :desc="
          message ||
          (status === -1
            ? $t('analysis.startAnalysisTips')
            : $t('common.noData'))
        " />
    </el-scrollbar>
  </div>
</template>

<script setup>
defineProps({
  status: {
    type: [Number, String],
    default: -1,
  },
  // 头部插槽是否一直存在
  showHeader: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  show: {
    type: Boolean,
    default: true,
  },
})
</script>

<style lang="scss" scoped>
.analysis-main__body {
  width: 100%;
  height: 100%;
  padding: 20px;
  padding-right: 0;
  color: var(--eas-text-color-primary);
}

.analysis-main__header {
  position: relative;
  z-index: 1;
}
.analysis-empty {
  position: absolute;
  inset: 0;
  margin: auto;
}
</style>
