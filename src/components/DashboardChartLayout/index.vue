<template>
  <div v-loading="loading" class="kanban-chart-card">
    <template v-if="!errMessage">
      <slot name="header" />
      <section class="kanban-chart-card__body">
        <slot v-if="status === 1" />
        <Empty v-else />
      </section>
    </template>
    <template v-else>
      <Empty :desc="errMessage" />
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Number,
    default: 0,
  },
  errMessage: {
    type: String,
    default: '',
  },
})

defineOptions({
  name: 'DashboardChartLayout',
})
</script>

<style lang="scss" scoped>
.kanban-chart-card {
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  &__body {
    flex: 1;
    position: relative;
    height: 100%;
  }
}
:deep(.empty-box) {
  position: absolute;
  inset: 0;
  margin: auto;
}
</style>
