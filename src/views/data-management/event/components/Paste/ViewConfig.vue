<template>
  <CommonDialog
    v-model="state.show"
    :title="$t('user.viewConfig')"
    @submit="submit"
    width="960px"
    :loading="state.operateLoading">
    <Condition
      :groupDefine="state.rowData.virtualEventParam"
      ref="conditionRef" />
  </CommonDialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Condition from '../Condition/index.vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['updConfig'])

const conditionRef = ref(null)
const state = reactive({
  show: false,
  operateLoading: false,
  rowData: {
    virtualEventParam: [],
  },
})
const submit = async () => {
  try {
    const virtualEventParam = await conditionRef.value.getResult()
    emit('updConfig', {
      ...state.rowData,
      virtualEventParam: JSON.stringify(virtualEventParam),
    })
    state.show = false
  } catch (err) {
    ElMessage.warning(err)
  }
}

const open = (val) => {
  state.rowData = val
  state.show = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'ViewConfig',
})
</script>

<style scoped lang="scss"></style>
