<template>
  <svg class="svg-icon" :style="style" aria-hidden="true">
    <use v-bind="$attrs" :xlink:href="`#icon-${name}`" :fill="color" />
  </svg>
</template>

<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  style: {
    type: [String, Object],
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
})
defineOptions({
  name: 'SvgIcon',
})
</script>

<style lang="scss" scoped>
.svg-icon {
  width: 1em;
  min-width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
