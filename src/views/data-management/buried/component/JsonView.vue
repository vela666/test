<template>
  <CommonDrawer
    v-model="state.drawerShow"
    :title="title || $t('common.title')"
    :showBtn="false"
    size="600px"
    close-on-click-modal
    close-on-press-escape>
    <json-viewer :value="jsonData" :expand-depth="5" copyable @copied="copied">
      <template #copy>
        <el-button type="primary"> {{ $t('btn.copy') }} </el-button>
      </template>
    </json-viewer>
  </CommonDrawer>
</template>

<script setup>
import { reactive } from 'vue'
import JsonViewer from 'vue-json-viewer'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

defineProps({
  jsonData: {
    type: Object,
    default: () => {},
  },
  title: {
    type: [String, Number],
    default: '',
  },
})

const state = reactive({
  drawerShow: false,
})

const open = () => {
  state.drawerShow = true
}

const copied = () => {
  ElMessage.success(t('common.successfulCopy'))
}

defineExpose({
  open,
})
</script>

<style lang="scss">
.jv-container .jv-code {
  padding: 0 !important;
}
.jv-container.jv-light .jv-button {
  color: var(--eas-color-primary) !important;
}
</style>
