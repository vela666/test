<template>
  <div :class="['sidebar', { open: isOpen }]">
    <button class="closebtn" @click="closeNav">×</button>
    <a href="#" @click.prevent="navigate('首页')">首页</a>
    <a href="#" @click.prevent="navigate('聊天')">聊天</a>
    <a href="#" @click.prevent="navigate('设置')">设置</a>
    <a href="#" @click.prevent="navigate('帮助')">帮助</a>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

// 通过 defineProps 定义传递的 props
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  onClose: {
    type: Function,
    required: true
  }
})

// 方法
const closeNav = () => {
  props.onClose()
}

const navigate = (page) => {
  alert(`导航到：${page}`)
}
</script>

<style scoped>
/* 侧边栏样式 */
.sidebar {
  position: fixed;
  z-index: 1;
  top: 0;
  right: -250px; /* 初始隐藏在右侧 */
  width: 250px;
  height: 100%;
  background-color: #111;
  color: white;
  transition: right 0.3s ease; /* 滑动效果 */
  padding-top: 60px;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
}

.sidebar a {
  padding: 16px;
  text-decoration: none;
  font-size: 22px;
  color: white;
  display: block;
  transition: 0.3s;
}

.sidebar a:hover {
  background-color: #575757;
}

.sidebar .closebtn {
  position: absolute;
  top: 20px;
  left: 10px;
  font-size: 36px;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
}

/* 当侧边栏打开时，修改位置 */
.sidebar.open {
  right: 0;
}
</style>
