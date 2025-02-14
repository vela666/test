<template>
  <CommonDrawer
    v-model="state.showOperate"
    closeOnClickModal
    closeOnPressEscape
    :title="$t('user.viewConfig')"
    :showBtn="false"
    size="900px">
    <el-form label-position="top">
      <LabelValueConfig
        v-if="state.dataInfo.createType === 4"
        disabled
        v-model="state.dataInfo.qp" />
      <FirstLastFeature
        v-if="state.dataInfo.createType === 5"
        disabled
        :qp="state.dataInfo.qp" />
      <Indicator
        v-if="state.dataInfo.createType === 6"
        disabled
        :qp="state.dataInfo.qp" />
      <AceEditor
        v-if="state.dataInfo.createType === 9"
        disabled
        v-model="state.dataInfo.tagSql"
        :toolbar="false"
        minLines="7" />
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { markRaw, reactive } from 'vue'
import LabelValueConfig from '@/views/user/user-tag/components/ConditionTag/LabelValueConfig.vue'
import FirstLastFeature from '@/views/user/user-tag/components/FirstLastFeature/Condition/index.vue'
import Indicator from '@/views/user/user-tag/components/Indicator/Condition/index.vue'

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
}
</style>
