<template>
  <CommonDialog
    v-model="state.show"
    width="550px"
    :loading="state.operatLoading"
    @submit="submit"
    @close="close"
    :title="t('btn.moveTo')">
    <el-form
      label-position="top"
      label-width="100px"
      ref="formRef"
      :model="state.formData">
      <SelectFolderOrSpace
        comprehensive
        @change="selectFolderOrSpaceChange"
        :selectData="state.currentData"
        v-model="state.formData.folderId" />
    </el-form>
  </CommonDialog>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import SelectFolderOrSpace from '@/views/see-plate/components/SideKanBan/components/SelectFolderOrSpace.vue'
import { asyncMoveKanBan } from '@/api/modules/unified-panel'
import { topLevelIdMap } from '@/views/see-plate/enum.js'
import { ElMessage } from 'element-plus'
import { asyncMoveFolder } from '@/api/modules/unified-panel/folder.js'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  batch: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['getData'])
const { t } = useI18n()

const formRef = ref(null)

const initVal = () => {
  return {
    show: false,
    operatLoading: false,
    moveSpaceId: null,
    currentData: null,
    selectFolderOrSpaceParams: {},
    formData: {
      folderId: '',
    },
  }
}
const state = reactive(initVal())

const selectFolderOrSpaceChange = (data) => {
  state.selectFolderOrSpaceParams = markRaw(data)
}

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operatLoading = true
    const isFolder = state.currentData.type === 'folder'
    const fn = isFolder ? asyncMoveFolder : asyncMoveKanBan

    let params = {
      dataItemList: [
        { id: state.currentData.id, type: state.currentData.type },
        ...state.selectFolderOrSpaceParams.children,
      ].map((item, index) => {
        return {
          id: item.id,
          order: index,
          type: item.type === 'dashboard' ? 1 : 2,
        }
      }),
      sourceModuleType: topLevelIdMap[state.currentData.topLevelId],
      targetModuleType:
        topLevelIdMap[
          state.selectFolderOrSpaceParams.topLevelId ||
            state.selectFolderOrSpaceParams.id
        ],
      businessId: state.currentData.businessId,
    }
    if (!isFolder) {
      params = {
        ...params,
        toFolderBusinessId: state.formData.folderId,
      }
    }
    await fn(params).finally((_) => {
      state.operatLoading = false
    })
    state.show = false
    ElMessage.success(t('common.moveSuccess'))
    emit('getData')
  })
}

// 批量时val是数组  单个是对象
const open = (val) => {
  state.currentData = markRaw(val)
  state.show = true
}
defineExpose({
  open,
})
defineOptions({
  name: 'MoveFolderOrKanban',
})
</script>

<style lang="scss"></style>
