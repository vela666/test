<template>
  <div class="nd-kanban-container p0 flex">
    <!--    <SideKanBan @getInfo="getInfo" ref="sideKanBanRef" />-->

    <Dashboard
      @execLoading="execLoading"
      @getData="getData"
      ref="dashboardRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
// import SideKanBan from '@mobile/views/see-plate/components/SideKanBan/index.vue'
import Dashboard from '@mobile/views/see-plate/components/Dashboard/index.vue'
import { recordBehavior } from '@/utils/record-behavior.js'

const dashboardRef = ref(null)
const sideKanBanRef = ref(null)

const execLoading = (bool) => {
  sideKanBanRef.value.execLoading(bool)
}

const getData = () => {
  sideKanBanRef.value.getData()
}

recordBehavior({
  moduleName: '数据看板',
  submoduleName: '数据看板',
  operate: '进入页面',
})
defineOptions({
  name: 'SeePlate',
})
</script>

<style scoped lang="scss">
.nd-kanban-container {
  padding: 0;
}
</style>
