<!--
 * **************************************************
 * @file 看板图表卡片页头
 * @author fengsi<294068744@qq.com>
 * @date 2024-03-05 09:55:05
 * **************************************************
-->

<script setup>
import { h, useSlots, computed } from 'vue'
import { ElDivider } from 'element-plus'

defineOptions({
  name: 'ChartCardHeader',
})

const spacer = h(ElDivider, { direction: 'vertical' })
const slots = useSlots()
const leftSlots = computed(() =>
  slots.left
    ? slots.left().filter((item) => !['v-if', ''].includes(item.children))
    : []
)
const rightSlots = computed(() =>
  slots.right
    ? slots.right().filter((item) => !['v-if', ''].includes(item.children))
    : []
)
</script>

<template>
  <section class="chart-card-header">
    <el-space :size="[8, 0]" :spacer="spacer" class="chart-card-header-l">
      <template v-if="leftSlots?.length > 0">
        <component
          v-for="(item, index) in leftSlots"
          :key="index"
          :is="item"></component>
      </template>
    </el-space>
    <el-space :size="0" class="nd-hide-operate">
      <template v-if="rightSlots?.length > 0">
        <component
          v-for="(item, index) in rightSlots"
          :key="index"
          :is="item"></component>
      </template>
    </el-space>
  </section>
</template>

<style scoped lang="scss">
.chart-card-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 40px;
  line-height: 1;
  font-size: var(--el-font-size-base);
  color: var(--eas-text-color-primary);

  > :deep(.el-space) > .el-space__item {
    > .el-button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
    }
  }
  :deep(.cycle-drop-box) {
    padding: 4px 0 !important;
    min-width: 0 !important;
  }

  :deep(.el-divider) {
    margin: 0;
  }
}
.chart-card-header-l {
  :deep(.el-space__item) {
    > * {
      &:not(.analysis-update-time) {
        &:hover {
          * {
            color: var(--eas-color-primary);
          }
        }
      }
    }
  }
}
</style>
