<template>
  <div class="text-wrap" style="white-space: pre-wrap">
    {{ info?.noteContent }}
  </div>
</template>

<script setup>
const props = defineProps({
  info: {
    type: Object,
    default() {
      return {}
    },
  },
})
defineOptions({
  name: 'Note',
})
</script>
