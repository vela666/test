<template>
  <CommonDialog
    width="400px"
    v-model="state.show"
    :title="t('btn.share')"
    btnSwap
    :loading="state.operatLoading"
    @submit="submit"
    @close="close">
    <template #header>
      <SvgIcon name="warning1" class="cff7d00" />
      <span class="ml10">{{ t('btn.share') }}</span>
    </template>
    <div class="mb10">
      {{ t('dashboard.shareFilterWith', [state.params.name]) }}
    </div>
    <el-radio-group v-model="state.type">
      <el-radio :value="1">{{ t('dashboard.dashboardMembers') }}</el-radio>
      <el-radio :value="2">{{
        t('dashboard.membersOfAllDashboardsInApp')
      }}</el-radio>
    </el-radio-group>
  </CommonDialog>
</template>

<script setup>
import { reactive } from 'vue'
import { asyncShareFilter } from '@/api/modules/see-plate/filter-favorite.js'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CommonDialog from '@/components/CommonDialog/index.vue'

const { t } = useI18n()

const initVal = () => {
  return {
    show: false,
    operatLoading: false,
    // 共享类型：1 共享给看板的成员，2 共享给当前应用下，所有看板的成员
    type: 1,
    params: {
      id: '',
      name: '',
    },
  }
}
const emit = defineEmits(['getData'])

const route = useRoute()
const state = reactive(initVal())

const close = () => {
  Object.assign(state, initVal())
}
const submit = async () => {
  state.operatLoading = true
  // 传事件
  await asyncShareFilter({
    businessId: route.query.kanBanId,
    favoriteId: state.params.id,
    shareSetType: 1,
    type: state.type,
  }).finally((_) => {
    state.operatLoading = false
  })
  state.show = false
  ElMessage.success(t('common.shareSuccess'))
  emit('getData')
}

const open = (data) => {
  state.show = true
  Object.assign(state.params, data)
}

defineExpose({
  open,
})
defineOptions({
  name: 'Share',
})
</script>

<style scoped lang="scss"></style>
