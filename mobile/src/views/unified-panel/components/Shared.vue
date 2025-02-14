<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.visible"
    :title="t('btn.share')"
    size="600px">
    <OperateTip class="mb20">
      <div>{{ t('common.tip') }}：{{ t('dashboard.reportSourceWarning') }}</div>
    </OperateTip>

    <CustomTreeSelection
      height="650px"
      :props="{
        label: 'name',
      }"
      nodeKey="newId"
      :selectedList="state.selectedList"
      v-model="state.selectedShareList"
      :data="state.optionalList">
      <template #rightOperate="{ data, delData }">
        <DropDownItemSelection>
          <div class="no-wrap flex-center c-pointer">
            <span class="mr5">{{
              t(`dashboard.${data.authority === 1 ? 'viewer' : 'collaborator'}`)
            }}</span>
            <el-icon>
              <ArrowDown />
            </el-icon>
          </div>
          <template #content>
            <label>
              <el-dropdown-item>
                <div class="flex">
                  <el-radio class="m0" v-model="data.authority" :value="1">
                    &nbsp;
                  </el-radio>
                  <div class="flex-column">
                    <span class="c545e6e">
                      {{ t('dashboard.viewer') }}
                    </span>
                    <span class="c86919d">
                      {{ t('dashboard.viewerDescription') }}
                    </span>
                  </div>
                </div>
              </el-dropdown-item>
            </label>
            <label>
              <el-dropdown-item>
                <div class="flex">
                  <el-radio class="m0" v-model="data.authority" :value="2"
                    >&nbsp;
                  </el-radio>
                  <div class="flex-column">
                    <span class="c545e6e">
                      {{ t('dashboard.collaborator') }}
                    </span>
                    <span class="c86919d text-wrap w200">
                      {{ t('dashboard.collaboratorDescription') }}
                    </span>
                  </div>
                </div>
              </el-dropdown-item>
            </label>
          </template>
        </DropDownItemSelection>
        <SvgIcon
          @click="delData(data)"
          class="c-pointer ml10 c8a8a8a fz16"
          name="close1" />
      </template>
    </CustomTreeSelection>
  </CommonDrawer>
</template>
<script setup>
import { markRaw, reactive } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { convertProjectMembersData } from '@/views/unified-panel/utils'
import {
  asyncGetMemberInfo,
  asyncGetShareMemberList,
  asyncShareKanBan,
} from '@/api/modules/unified-panel'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import useUnifiedPanelStore from '@/store/modules/unified-panel.js'
import useUserStore from '@/store/modules/user.js'
import { traverseTree } from '@/utils/dataProcessing.js'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  businessId: {
    type: String,
    default: '',
  },
})
const { t } = useI18n()

const emit = defineEmits(['getInfo'])
const route = useRoute()
const unifiedPanelStore = useUnifiedPanelStore()
const userStore = useUserStore()

const initVal = () => {
  return {
    // 已选回显列表数据
    selectedList: [],
    selectedShareList: [],
    optionalList: [],
    visible: false,
    operateLoading: false,
  }
}

const state = reactive(initVal())

const getMemberInfo = async () => {
  const { data } = await asyncGetMemberInfo()
  state.optionalList = traverseTree(convertProjectMembersData(data), (item) => {
    // 是管理者
    if (unifiedPanelStore.selectedInfo.authority === 3) {
      // 过滤当前登陆账户的数据
      item.notShow = item.id === userStore.userInfo.id
    }
  })
}

const getSelectedShareMemberList = async (id) => {
  const { data } = await asyncGetShareMemberList(id)

  state.selectedList = markRaw(
    data
      .filter((item) => item.authority !== 3)
      .map((item) => {
        return {
          ...item,
          // 这里的newId和convertProjectMembersData里的一致
          newId: `${item.id}-${item.dataType}`,
        }
      })
  )
}

const close = () => {
  Object.assign(state, initVal())
}
const open = async () => {
  try {
    state.operateLoading = true
    state.visible = true
    if (props.businessId) {
      await getSelectedShareMemberList(props.businessId)
    }
    await getMemberInfo()
  } catch (e) {
    console.log(e)
  }
  state.operateLoading = false
}
const submit = async () => {
  state.operateLoading = true
  await asyncShareKanBan({
    businessIds: [props.businessId],
    shareMemberList: state.selectedShareList.map((item) => {
      return {
        authority: item.authority,
        dataType: item.dataType,
        id: item.id,
        name: item.name,
      }
    }),
  })
  ElMessage.success(t('common.operationSuccessfully'))
  state.operateLoading = false
  state.visible = false
  emit('getInfo')
}

defineExpose({
  open,
})
defineOptions({
  name: 'Shared',
})
</script>
