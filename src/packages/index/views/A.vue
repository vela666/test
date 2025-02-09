<!--
<template>
  <div id="app">
    <Sidebar :isOpen="isSidebarOpen" :onClose="closeSidebar" />
    <MainContent :onOpen="openSidebar" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar/index.vue'
import MainContent from './Sidebar/MainContent.vue'

// 响应式数据
const isSidebarOpen = ref(false)

// 方法
const openSidebar = () => {
  isSidebarOpen.value = true
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<style>
#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
-->

<template>
  <el-button type="primary" style="margin-left: 16px" @click="drawer = true">
    open
  </el-button>
  <el-button type="primary" style="margin-left: 16px" @click="drawer2 = true">
    with footer
  </el-button>

  <el-drawer
      size="85%"
      :modal="false"
      :with-header="false"
      v-model="drawer"
      title="I am the title"
      :direction="direction"
      :before-close="handleClose"
  >
    <span>Hi, there!</span>
  </el-drawer>
  <el-drawer v-model="drawer2" :direction="direction">
    <template #header>
      <h4>set title by slot</h4>
    </template>
    <template #default>
      <div>
        <el-radio v-model="radio1" value="Option 1" size="large">
          Option 1
        </el-radio>
        <el-radio v-model="radio1" value="Option 2" size="large">
          Option 2
        </el-radio>
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="cancelClick">cancel</el-button>
        <el-button type="primary" @click="confirmClick">confirm</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script  setup>
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'

const drawer = ref(false)
const drawer2 = ref(false)
const direction = ref('ltr')
const radio1 = ref('Option 1')
const handleClose = (done) => {
  ElMessageBox.confirm('Are you sure you want to close this?')
      .then(() => {
        done()
      })
      .catch(() => {
        // catch error
      })
}
function cancelClick() {
  drawer2.value = false
}
function confirmClick() {
  ElMessageBox.confirm(`Are you confirm to chose ${radio1.value} ?`)
      .then(() => {
        drawer2.value = false
      })
      .catch(() => {
        // catch error
      })
}
</script>
