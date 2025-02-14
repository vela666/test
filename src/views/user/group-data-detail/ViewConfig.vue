<template>
  <CommonDrawer
    v-model="state.showOperate"
    closeOnClickModal
    closeOnPressEscape
    :title="$t('user.viewConfig')"
    :showBtn="false"
    size="900px">
    <!-- 条件分群 -->
    <Condition
      disabled
      :groupDefine="state.dataInfo.qp"
      v-if="state.dataInfo.createType === 1" />
    <AceEditor
      v-else
      disabled
      v-model="state.dataInfo.clusterSql"
      :toolbar="false"
      minLines="7" />
  </CommonDrawer>
</template>

<script setup>
import { computed, watch, reactive, ref, markRaw } from 'vue'
import Condition from '@/views/user/components/Condition/index.vue'

const state = reactive({
  showOperate: false,
  dataInfo: {},
})

const open = async (val) => {
  state.dataInfo = markRaw(val)
  state.showOperate = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'ViewConfig',
})
</script>

<style scoped lang="scss">
:deep(.nd-condition-content-list) {
  gap: 10px;
  .nd-event-list {
    > div {
      align-items: center;
    }
  }
}
</style>
