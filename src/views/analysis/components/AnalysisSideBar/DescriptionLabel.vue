<template>
  <div class="section-label">
    <svg-icon :name="icon" class="mr5"></svg-icon>
    {{ label }}
  </div>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: '',
  },
  label: {
    type: [String, Number],
    default: '',
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.section-label {
  width: 100%;
  height: 64px;
  line-height: 64px;
  font-size: var(--eas-font-size-medium);
  color: var(--eas-text-color-primary);
  font-weight: bold;
  padding-left: 20px;
}
</style>
