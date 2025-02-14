<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="700px"
    :loading="state.operateLoading"
    v-model="state.show"
    :showFooterR="authorityIs3">
    <template #title>
      <span
        >{{
          t(
            `dashboard.${state.otherParams.id ? 'spaceSettings' : 'createSpace'}`
          )
        }}
      </span>

      <Tooltip v-if="!state.otherParams.id" placement="right">
        <SvgIcon class="fz16 ml5 c86919d" name="help2" />
        <template #content>{{ t('dashboard.createSharedSpace') }}</template>
      </Tooltip>
    </template>
    <div class="flex-column gap16">
      <el-form
        ref="formRef"
        :model="state.formData"
        :rules="formRules"
        label-position="top"
        label-width="100px">
        <el-form-item :label="t('dashboard.spaceName')" prop="name">
          <CommonInput
            :prefixSlot="false"
            v-model="state.formData.name"
            maxlength="100"
            :disabled="state.otherParams.authority !== 3"
            show-word-limit
            :clearable="false" />
        </el-form-item>
        <el-form-item :label="t('dashboard.spaceMembers')" prop="members">
          <CustomTreeSelection
            height="635px"
            :props="{
              label: 'name',
            }"
            nodeKey="newId"
            :hide="!authorityIs3"
            v-model="state.formData.members"
            :data="state.optionalList">
            <template #rightTop>
              <div class="flex-column">
                <span class="w100-percentage c86919d mb5">
                  {{ t('common.admin') }}
                </span>
                <div class="selected flex-center flex-between">
                  <span v-showTips class="w100-percentage c545e6e mr10">
                    {{ manager?.name }}
                  </span>
                </div>
              </div>
            </template>
            <template #rightOperate="{ data, delData }">
              <div class="flex-center">
                <DropDownItemSelection :showDropdown="authorityIs3">
                  <div
                    :class="[
                      'no-wrap',
                      'flex-center',
                      authorityIs3 && 'c-pointer',
                    ]">
                    <span class="mr5">
                      {{
                        t(
                          `common.${data.authority === 1 ? 'viewOnly' : 'editPermission'}`
                        )
                      }}
                    </span>
                    <el-icon v-show="authorityIs3">
                      <ArrowDown />
                    </el-icon>
                  </div>
                  <template #content>
                    <label>
                      <el-dropdown-item>
                        <div class="flex">
                          <el-radio
                            class="m0"
                            v-model="data.authority"
                            :value="1">
                            &nbsp;
                          </el-radio>
                          <div class="flex-column">
                            <span class="c545e6e">
                              {{ t('common.viewOnly') }}
                            </span>
                            <span class="c86919d">
                              {{ t('dashboard.viewOnlyDashboards') }}
                            </span>
                          </div>
                        </div>
                      </el-dropdown-item>
                    </label>
                    <label>
                      <el-dropdown-item>
                        <div class="flex">
                          <el-radio
                            class="m0"
                            v-model="data.authority"
                            :value="2">
                            &nbsp;
                          </el-radio>
                          <div class="flex-column">
                            <span class="c545e6e">
                              {{ t('common.editPermission') }}
                            </span>
                            <span class="c86919d text-wrap">
                              {{ t('dashboard.addPermission') }}
                            </span>
                          </div>
                        </div>
                      </el-dropdown-item>
                    </label>
                  </template>
                </DropDownItemSelection>
                <SvgIcon
                  v-if="authorityIs3"
                  @click="delData(data)"
                  class="c-pointer ml10 c8a8a8a fz16"
                  name="close1" />
              </div>
            </template>
          </CustomTreeSelection>
        </el-form-item>
      </el-form>
    </div>
    <template #footer-l v-if="state.otherParams.businessId">
      <template v-if="authorityIs3">
        <el-button @click="handoverSpace">{{
          t('dashboard.transferSpace')
        }}</el-button>
        <el-button @click="deleteSpace">{{
          t('dashboard.deleteSpace')
        }}</el-button>
      </template>
      <el-button @click="showOperateLog">{{
        t('common.operationLog')
      }}</el-button>
    </template>
  </CommonDrawer>
  <HandoverSpaceDialog
    :data="handoverSpaceMemberList"
    :params="state.otherParams"
    ref="handoverSpaceDialogRef"
    @submit="
      () => {
        emit('getData')
        close()
      }
    " />
  <OperateVerifyDialog ref="operateVerifyDialogRef" />
  <OperateLog
    :data="state.operateLogData"
    :loading="state.loading"
    v-model="state.operateLogVisible" />
</template>

<script setup>
import { reactive, ref, markRaw, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import HandoverSpaceDialog from './HandoverSpaceDialog.vue'
import { isObject } from '@/utils/types'
import useUserStore from '@/store/modules/user'
import { flattenTree } from '@/utils/dataProcessing'
import { asyncGetMemberInfo } from '@/api/modules/see-plate'
import { operationLogInfo } from '@/api/modules/analysis'
import {
  asyncGetSpaceInfo,
  asyncAddSpace,
  asyncEditSpace,
  asyncRemoveSpace,
} from '@/api/modules/see-plate/space'
import { convertProjectMembersData } from '@/views/see-plate/utils'
import { recordBehavior } from '@/utils/record-behavior.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const formRules = {
  name: [
    { required: true, message: t('common.pleaseEnter') },
    { min: 1, max: 100, message: t('rules.length1To100', [t('common.name')]) },
  ],
  // members: [{ required: true, message: '请选择' }],
}
const emit = defineEmits(['getData'])

const userStore = useUserStore()

const initVal = () => {
  return {
    show: false,
    loading: false,
    operateLoading: false,
    operateLogVisible: false,
    optionalList: [],
    operateLogData: [],
    // 已选列表
    selectedList: [],
    otherParams: {
      authority: 3,
      id: '',
    },
    formData: {
      name: '',
      members: [],
      // spaceId: 1,
    },
  }
}

const formRef = ref(null)
const handoverSpaceDialogRef = ref(null)
const operateVerifyDialogRef = ref(null)
const state = reactive(initVal())

const authorityIs3 = computed(() => {
  return state.otherParams.authority === 3
})

const optionaDataFlat = computed(() => {
  return flattenTree(state.optionalList)
})

const handoverSpaceMemberList = computed(() => {
  // 成员
  return state.optionalList?.[1]?.children?.filter((item) => {
    return item.id !== manager.value.id
  })
})

const manager = computed(() => {
  // 编辑
  const bool = !!state.otherParams.businessId
  let data = {
    dataType: '1',
    id: userStore.userInfo.id,
    name: userStore.userInfo.name,
    newId: `${userStore.userInfo.id}-1`,
  }
  if (bool) {
    // 管理者
    data = state.selectedList.find((item) => item.authority === 3)
  }
  return data ? { ...data, authority: 3 } : {}
})

const handoverSpace = () => {
  handoverSpaceDialogRef.value.open()
}
const deleteSpace = () => {
  operateVerifyDialogRef.value.open({
    title: t('dashboard.deleteSpace'),
    verifyText: t('dashboard.confirmDeleteSpace'),
    content: t('dashboard.deleteSpaceWarning', [state.otherParams.name]),
    close() {},
    async submit() {
      await asyncRemoveSpace({
        dataType: 3,
        moduleType: 3,
        spaceBusinessIds: [state.otherParams.businessId],
      })
      state.show = false
      ElMessage.success(t('common.deleteSuccessfully'))
      emit('getData')
    },
  })
}

const showOperateLog = async () => {
  state.operateLogVisible = true
  const { data } = await operationLogInfo({
    businessId: state.otherParams.businessId,
    logModuleType: 1,
  })
  state.operateLogData = markRaw(data)
}

const change = (obj) => {
  state.targetObj = markRaw(obj)
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    // state.operateLoading = true
    // 空间id spaceId: state.otherParams.id
    // 编辑时传空间id
    const bool = !!state.otherParams.businessId
    const fn = bool ? asyncEditSpace : asyncAddSpace

    if (!bool) {
      recordBehavior({
        moduleName: '数据看板',
        submoduleName: '数据看板',
        operate: '新建空间',
      })
    }
    const params = {
      name: state.formData.name,
      ...[manager.value, ...state.formData.members].reduce(
        (p, c) => {
          const obj = {
            authority: c.authority,
            id: c.id,
            name: c.name,
          }
          if (+c.dataType === 1) {
            p.spaceMemberList.push(obj)
          } else {
            p.spaceProjectList.push(obj)
          }
          return p
        },
        {
          spaceMemberList: [],
          spaceProjectList: [],
        }
      ),
    }
    if (bool) {
      params.businessId = state.otherParams.businessId
      params.dataType = 3
      params.moduleType = 3
    }
    await fn(params).finally((_) => {
      state.operateLoading = false
    })
    state.show = false
    emit('getData')
    ElMessage.success(`${bool ? '编辑' : '新建'}成功`)
  })
}

const getMemberInfo = async () => {
  const { data } = await asyncGetMemberInfo()
  return convertProjectMembersData(data)
}

const getSpaceInfo = async (params) => {
  const { data } = await asyncGetSpaceInfo(params)
  state.formData.name = data.name
  state.selectedList = markRaw(
    [...data.spaceMemberList, ...data.spaceProjectList].map((item) => {
      return {
        ...item,
        // 这里的newId和convertProjectMembersData里的一致z
        newId: `${item.id}-${item.dataType}`,
      }
    })
  )
}

const open = async (val) => {
  try {
    const bool = isObject(val)
    state.show = true
    state.operateLoading = true
    if (bool) {
      Object.assign(state.otherParams, val)
      await getSpaceInfo({
        businessId: val.businessId,
        dataType: 3,
        moduleType: 3,
      })
    }
    state.optionalList = await getMemberInfo()
    optionaDataFlat.value.forEach((item) => {
      if (bool) {
        const value = state.selectedList.find((v) => v.newId === item.newId)
        if (value) {
          item.authority = value.authority
          item.selected = true
        }
      }
      item.notShow = item.id === manager.value.id
    })
  } catch (e) {
    console.log(e)
  }
  state.operateLoading = false
}

defineExpose({
  open,
})
defineOptions({
  name: 'AddOrEditSpace',
})
</script>
