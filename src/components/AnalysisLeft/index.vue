<script setup>
defineOptions({
  name: 'AnalysisLeft',
})
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="data-analysis-left" v-loading="loading">
    <div class="data-analysis-left__body" v-show="!loading">
      <slot></slot>
    </div>
    <div class="data-analysis-left__footer" v-show="!loading">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-analysis-left {
  height: 100%;
  color: var(--eas-text-color-primary);
  &__body {
    height: calc(100% - 72px);
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 6px;
    }
  }
  &__footer {
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 20px;
  }
}
</style>
