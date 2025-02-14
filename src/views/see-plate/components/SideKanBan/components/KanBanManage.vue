<template>
  <CommonDrawer
    direction="ltr"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.visible"
    :title="t('dashboard.dashboardManagement')"
    :showBtn="false"
    size="650px">
    <div class="flex-column gap16">
      <div class="flex-center flex-between">
        <el-checkbox
          @change="navExpandChange"
          v-model="seePlateStore.navigationExpand">
          <span class="fz12 c545e6e mr5">
            {{ t('dashboard.defaultExpandNav') }}
          </span>
          <Tooltip>
            <SvgIcon name="help2" class="c86919d" />
            <template #content>
              {{ t('dashboard.checkExpandNav') }}
            </template>
          </Tooltip>
        </el-checkbox>
        <div>
          <el-button
            @click="handleShared"
            :disabled="!state.selectedKanBanList.length">
            <SvgIcon name="kanban-share1" class="mr5 fz16" />
            {{ t('dashboard.shareDashboard') }}
          </el-button>
          <el-button
            @click="handleMove"
            :disabled="!state.selectedKanBanList.length"
            class="ml10">
            <SvgIcon name="move2" class="mr5 fz18" />
            {{ t('btn.move') }}
          </el-button>
          <el-button
            @click="handleDelete"
            :disabled="!state.selectedKanBanList.length">
            <SvgIcon name="delete1" class="mr5" />
            {{ t('btn.delete') }}
          </el-button>
        </div>
      </div>
      <CustomTreeSelection
        :props="{
          disabled: 'manageDisabled',
          label: 'name',
        }"
        :nodeKey="kanBanDataUniqueKey"
        v-model="state.selectedKanBanList"
        :data="optionalList" />
    </div>
  </CommonDrawer>
  <Shared
    @getInfo="getInfo"
    :selectedKanBanList="state.selectedKanBanList"
    ref="sharedRef" />
  <MoveFolderOrKanban @getData="getData" batch ref="moveFolderOrKanbanRef" />
  <OperateVerifyDialog ref="operateVerifyDialogRef" />
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import Shared from '@/views/see-plate/components/Shared.vue'
import MoveFolderOrKanban from './MoveFolderOrKanban.vue'
import { debounce } from 'lodash-es'
import useSeePlateStore from '@/store/modules/see-plate'
import { kanBanDataUniqueKey, topLevelIdMap } from '@/views/see-plate/enum'
import { mapKanBanList } from '@/views/see-plate/utils'
import {
  asyncDeleteKanBan,
  asyncNavigationSetting,
} from '@/api/modules/see-plate/dashboard'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const seePlateStore = useSeePlateStore()

const emit = defineEmits(['getData'])
const initVal = () => {
  return {
    visible: false,
    selectedKanBanList: [],
    operateLoading: false,
  }
}

const sharedRef = ref(null)
const moveFolderOrKanbanRef = ref(null)
const operateVerifyDialogRef = ref(null)
const state = reactive(initVal())

const optionalList = computed(() => {
  return mapKanBanList({
    data: seePlateStore.leftCompleteData,
    delKey: ['shareModule'],
  })
})

const navExpandChange = debounce((navigationExpand) => {
  asyncNavigationSetting({
    navigationExpand,
  })
}, 300)

const getInfo = () => {
  state.visible = false
  seePlateStore.getShareMemberList()
}

const getData = () => {
  emit('getData')
  state.visible = false
}

const handleShared = () => {
  sharedRef.value.open()
}

const handleDelete = () => {
  operateVerifyDialogRef.value.open({
    title: t('dashboard.deleteDashboard'),
    verifyText: t('dashboard.confirmDeleteSelected'),
    content: t('dashboard.confirmDeleteCount', [
      state.selectedKanBanList.length,
    ]),
    async submit() {
      await asyncDeleteKanBan({
        dataItemList: state.selectedKanBanList.map((item) => {
          return {
            businessId: item.businessId,
            dataType: 1,
            moduleType: topLevelIdMap[item.topLevelId],
          }
        }),
      })
      ElMessage.success(t('common.deleteSuccessfully'))
      getData()
    },
  })
}
const handleMove = () => {
  moveFolderOrKanbanRef.value.open(state.selectedKanBanList)
}

const close = () => {
  Object.assign(state, initVal())
}
const open = () => {
  state.visible = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'KanBanManage',
})
</script>
