<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
})

defineOptions({
  name: 'MenuItem',
})
</script>

<template>
  <div class="eas-menu-item">
    <svg-icon
      v-if="props.icon"
      :name="props.icon"
      class="eas-menu-item__icon"></svg-icon>
    <div v-if="props.title" class="eas-menu-item__title">{{ props.title }}</div>
  </div>
</template>

<style scoped lang="scss">
.eas-menu-item {
  display: inline-flex;
  align-items: center;
  &__icon {
    font-size: var(--eas-font-size-large);
    margin-right: 5px;
    color: var(--eas-text-color-light);
  }
  &__title {
    height: 19px;
    line-height: 19px;
    font-size: var(--eas-font-size-base);
    font-weight: 400;
  }
}
</style>
