<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { kanbanSelectKey } from '@/views/see-plate/enum'
const router = useRouter()

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
  list: {
    type: Array,
    default: () => [],
  },
})

const goToDashboard = (obj) => {
  const { dashboardAuthority, dashboardBusinessId } = obj
  if (dashboardAuthority === -1) return
  const path = '/see-plate'
  /// src/views/see-plate/components/SideKanBan/index.vue的handleSelectedKanban方法
  // 因为进入数据看板时会取本地看板标识，则需要删除，不然会导致看板选择错误
  localStorage.removeItem(kanbanSelectKey)
  const routeUrl = router.resolve({
    path,
    query: {
      kanBanId: dashboardBusinessId,
      virtualAppId: sessionStorage.getItem('appId'),
    },
  })
  window.open(routeUrl.href, '_blank')
}

const dashboardDropdownRef = ref()

/**
 * @description 打开删除弹框
 */
const handleOpen = () => {
  dashboardDropdownRef.value.handleOpen()
}

/**
 * @description 取消删除弹框
 */
const handleCancle = () => {
  dashboardDropdownRef.value.handleClose()
}

defineOptions({
  name: 'DashboardDropdown',
})
</script>
<template>
  <div>
    <el-dropdown
      ref="dashboardDropdownRef"
      trigger="contextmenu"
      popper-class="code_type__dropdown"
      v-if="count > 0">
      <el-button text type="primary" @click="handleOpen">
        {{ count }}
      </el-button>
      <template #dropdown>
        <el-dropdown-menu style="max-height: 300px">
          <el-dropdown-item
            v-for="(item, index) in list"
            :key="index"
            @click="goToDashboard(item)"
            :disabled="item.dashboardAuthority === -1">
            {{ item.dashboardName }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div v-else>{{ count }}</div>
  </div>
</template>
<style lang="scss" scoped></style>
