<template>
  <div class="nd-kanban-container p0 flex">
    <SideKanBan
      @addKanbanFn="addKanbanFn"
      @getInfo="getInfo"
      ref="sideKanBanRef" />
    <Dashboard
      @execLoading="execLoading"
      @getData="getData"
      ref="dashboardRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SideKanBan from './components/SideKanBan/index.vue'
import Dashboard from './components/Dashboard/index.vue'
import { recordBehavior } from '@/utils/record-behavior.js'

const dashboardRef = ref(null)
const sideKanBanRef = ref(null)

const execLoading = (bool) => {
  sideKanBanRef.value.execLoading(bool)
}

const getData = () => {
  sideKanBanRef.value.getData()
}

const getInfo = () => {
  dashboardRef.value.getInfo()
}

const addKanbanFn = (empty) => {
  dashboardRef.value.addKanbanFn(empty)
}

recordBehavior({
  moduleName: '综合看板',
  operate: '进入页面',
})
defineOptions({
  name: 'UnifiedPanel',
})
</script>

<style scoped lang="scss">
.nd-kanban-container {
  padding: 0;
}
</style>
