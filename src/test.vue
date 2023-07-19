<template>
  <div id="boxCls" ref="targetRef"></div>
</template>

<script setup>
import { h, render, ref, onMounted, useSlots } from 'vue'
const slots = useSlots()
const targetRef = ref(null)
const initLayout = () => {
  const itemContentVNode = h(
    'div',
    {
      onRemove(item) {
        console.log(item, 'item')
      },
    },
    // 插槽
    slots,
  )
  // Render the vue node into the item element
  render(itemContentVNode, targetRef.value)
}
onMounted(() => {
  initLayout()
})

</script>
