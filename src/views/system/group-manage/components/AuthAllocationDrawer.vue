<script setup>
import { reactive, ref, markRaw } from 'vue'
import {
  getDataPermissionMembers,
  assignDataPermission,
} from '@/api/modules/data-permission'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const props = defineProps({
  selectedGruop: {
    type: Object,
    default: () => {},
  },
  authRow: {
    type: Object,
    default: () => {},
  },
})

const state = reactive({
  dialogVisible: false,
  loading: false,
  optionaMemberlData: [],
  memberFormData: {
    selectedMembers: [],
  },
})

/**
 * @description 开启分配权限
 */
const openHandle = () => {
  state.dialogVisible = true
  getOptionalUserList()
}

/**
 * @description 获取项目组成员
 */
const getOptionalUserList = async () => {
  state.loading = true
  try {
    const res = await getDataPermissionMembers({
      id: props.authRow.dataPermissionId,
      projectId: props.selectedGruop.id,
    })
    if (res && res.code === 200) {
      state.optionaMemberlData = markRaw(res.data)
      state.memberFormData.selectedMembers = res.data
        .filter((e) => !!e.isAuthorized)
        .map((e) => e.userId)
    }
  } catch (e) {
    console.error(e)
  } finally {
    state.loading = false
  }
}

/**
 * @description 关闭
 */
const allocationAuthClose = () => {
  state.dialogVisible = false
}

/**
 * @description 提交
 */
const allocationAuthSubmit = () => {
  const members = []
  state.optionaMemberlData.forEach((item) => {
    if (state.memberFormData.selectedMembers.includes(item.userId)) {
      members.push({
        userId: item.userId,
      })
    }
  })
  const data = {
    appId: props.authRow.appId,
    dataPermissionId: props.authRow.dataPermissionId,
    projectId: props.selectedGruop.id,
    members,
  }
  state.loading = true
  assignDataPermission(data)
    .then((res) => {
      if (res && res.code === 200) {
        ElMessage.success(
          t('system.projectTeams.permissionPackageAllocationSuccessful')
        )
        allocationAuthClose()
      }
    })
    .finally(() => {
      state.loading = false
    })
}

defineExpose({ openHandle })

defineOptions({
  name: 'AuthAlloctaionDrawer',
})
</script>
<template>
  <CommonDrawer
    v-model="state.dialogVisible"
    size="600px"
    :title="$t('system.projectTeams.allocationPermissionPackage')"
    @close="allocationAuthClose"
    @submit="allocationAuthSubmit"
    :loading="state.loading">
    <el-form
      label-position="top"
      label-width="100px"
      :model="state.memberFormData">
      <el-form-item
        :label="`${$t('system.projectTeams.selectProjectMembers')}：`"
        prop="selectedMembers">
        <div class="w100-percentage">
          <OptionalDataSelection
            valueLabel="userName"
            valueKey="userId"
            :list="state.optionaMemberlData"
            v-model="state.memberFormData.selectedMembers" />
        </div>
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>
<style lang="scss" scoped></style>
