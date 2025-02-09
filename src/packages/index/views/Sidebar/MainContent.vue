<template>
  <div id="main">
    <button class="openbtn" @click="openNav">侧边栏</button>
    <h2>主内容区域</h2>
    <p>这是主内容区域，侧边栏会覆盖在右侧内容区域上。</p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

// 通过 defineProps 定义传递的 props
const props = defineProps({
  onOpen: {
    type: Function,
    required: true
  }
})

// 方法
const openNav = () => {
  props.onOpen()
}
</script>

<style scoped>
#main {
  padding: 20px;
}

/* 侧边栏打开时主内容区偏移 */
#main.open {
  margin-left: 250px;
}
</style>
