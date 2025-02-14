<template>
  <div class="nd-operate-tips">
    <SvgIcon :name="icon" :class="[iconClass, 'cff7d00']" />
    <div class="fz14" :class="[tipClass]">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
// 如事件属性配置事件和发布属性
const props = defineProps({
  tipClass: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'warning1',
  },
  iconClass: {
    type: String,
    default: 'fz20 mr5',
  },
})

defineOptions({
  name: 'OperateTip',
})
</script>

<style scoped lang="scss">
.nd-operate-tips {
  display: flex;
  //align-items: center;
  padding: 5px 10px;
  background-color: var(--eas-color-warning-light-1);
  border-radius: 4px;
  //font-size: 12px;
  font-weight: 400;
  color: var(--eas-text-color);
}
</style>
