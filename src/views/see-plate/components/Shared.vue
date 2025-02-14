<template>
  <CommonDrawer
    :direction="direction"
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.visible"
    :title="t('btn.share')"
    size="600px">
    <OperateTip class="mb20">
      <div>
        {{ t('common.tip') }}：
        <span v-show="!businessId">
          {{ t('dashboard.shareOperationNote') }}</span
        >
        <span> {{ t('dashboard.shareRestrictionNote') }}</span>
      </div>
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
import { convertProjectMembersData } from '@/views/see-plate/utils'
import { asyncGetMemberInfo } from '@/api/modules/see-plate'
import {
  asyncGetShareMemberList,
  asyncShareKanBan,
} from '@/api/modules/see-plate/dashboard.js'
import { topLevelIdMap } from '@/views/see-plate/enum.js'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import useSeePlateStore from '@/store/modules/see-plate.js'
import useUserStore from '@/store/modules/user.js'
import { traverseTree } from '@/utils/dataProcessing.js'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  direction: {
    type: String,
    default: 'ltr',
  },
  // 没值是批量
  businessId: {
    type: String,
    default: '',
  },
  // 批量时传入
  selectedKanBanList: {
    type: Array,
    default() {
      return []
    },
  },
})
const emit = defineEmits(['getInfo'])
const route = useRoute()
const { t } = useI18n()
const seePlateStore = useSeePlateStore()
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
    // 单个看板里分享判断权限 || 批量分享时
    if (seePlateStore.selectedInfo.authority === 3 || !props.businessId) {
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
          // 这里的newId和convertProjectMembersData里的一致z
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
  const hasBusinessId = props.businessId
  const dataItemList = hasBusinessId
    ? [
        {
          businessId: route.query.kanBanId,
          dataType: 1,
          moduleType: route.query.moduleType,
        },
      ]
    : props.selectedKanBanList.map((item) => {
        return {
          businessId: item.businessId,
          dataType: 1,
          moduleType: topLevelIdMap[item.topLevelId],
        }
      })

  await asyncShareKanBan({
    // 标识 1是单个看板里的共享，2是看板管理里的共享
    type: hasBusinessId ? 1 : 2,
    dataItemList,
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
