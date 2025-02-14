<template>
  <CommonDrawer
    v-model="state.visible"
    :title="$t('system.members.setResignation')"
    size="700px"
    :loading="state.loading"
    @submit="handleSubmit">
    <div class="tips-content mb20">
      <el-text type="info">
        {{
          $t('system.members.operateTransferData', [
            state.userInfo.name,
            state.userInfo.account,
          ])
        }}
      </el-text>
      <div>
        <el-text type="info">
          1、{{ $t('system.members.transferableDataInclude') }}
        </el-text>
      </div>
      <el-text type="info">
        2、{{ $t('system.members.dataAssetsProjectTeam') }}
      </el-text>
    </div>

    <div class="asset-content">
      <div
        class="assent-content__item mt20"
        v-for="(item, i) in state.projectInfoList"
        :key="item.uuid">
        <el-text type="info"
          >{{ $t('system.projectTeams.projectTeam') }}：{{
            item.projectName
          }}</el-text
        >
        <el-table
          :max-height="400"
          :data="item.appInfoList"
          class="nd-table-custom mt10">
          <el-table-column :label="$t('system.apps.app')" prop="appName" />
          <el-table-column :label="$t('system.members.receiveMembers')">
            <template #header="{ column }">
              <span class="flex-shrink-0 mr10">{{
                $t('system.members.receiveMembers')
              }}</span>
              <el-select
                :placeholder="$t('system.members.unifiedMembers')"
                v-model="column.userInfo"
                value-key="userId"
                @change="(val) => multiAcceptUser(val, i)">
                <el-option
                  v-for="val in item.userInfoList"
                  :key="val.userId"
                  :label="val.name"
                  :value="val" />
              </el-select>
            </template>
            <template #default="{ row }">
              <el-select
                :placeholder="$t('system.members.selectMembers')"
                value-key="userId"
                v-model="row.userInfo"
                clearable
                @change="singleAcceptUser(row, i)">
                <el-option
                  v-for="val in item.userInfoList"
                  :key="val.userId"
                  :label="val.name"
                  :value="val" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </CommonDrawer>
</template>

<script setup>
import { reactive } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { userDepart } from '@/api/modules/user'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

defineOptions({
  name: 'UserDepart',
})

const emit = defineEmits(['getList'])

const state = reactive({
  visible: false,
  projectInfoList: [],
  userInfo: {},
  loading: false,
})

/**
 * @description: 统一选择接收成员
 * @return {*}
 */
const multiAcceptUser = (val, i) => {
  state.projectInfoList[i].appInfoList.forEach((item) => (item.userInfo = val))
  const appIds = state.projectInfoList[i].appInfoList.map((item) => item.appId)
  validAcceptUser(appIds, i)
}

/**
 * @description: 单个应用切换接收成员
 * @return {*}
 */
const singleAcceptUser = (row, i) => {
  validAcceptUser([row.appId], i)
}

/**
 * @description: 校验同一个应用是否已经选择了接收成员，如果有，则置空之前应用的接收成员
 * @return {*}
 */
const validAcceptUser = (appIds, i) => {
  for (const j in state.projectInfoList) {
    if (i == j) {
      continue
    }
    const appInfoList = state.projectInfoList[j].appInfoList
    for (const index in appInfoList) {
      if (appIds.includes(appInfoList[index].appId)) {
        appInfoList[index].userInfo = undefined
      }
    }
  }
}

/**
 * @description: 设为离职
 * @return {*}
 */
const handleSubmit = () => {
  let groupList = []
  for (const item of state.projectInfoList) {
    const obj = {
      projectId: item.projectId,
      projectName: item.projectName,
      appList: [],
    }

    item.appInfoList.forEach((val) => {
      if (val.userInfo?.userId) {
        obj.appList.push({
          appId: val.appId,
          appName: val.appName,
          userId: val.userInfo?.userId,
          userName: val.userInfo?.name,
        })
      }
    })

    groupList.push(obj)
  }

  groupList = groupList.filter((item) => item.appList.length > 0)

  const params = {
    userId: state.userInfo.userId,
    groupList,
  }
  state.loading = true
  userDepart(params)
    .then(() => {
      ElMessage.success(t('common.operationSuccessfully'))
      state.visible = false
      emit('getList')
    })
    .finally(() => {
      state.loading = false
    })
}

const open = (data, userInfo) => {
  state.userInfo = userInfo
  state.projectInfoList = data.projectInfoList.map((item) => ({
    ...item,
    uuid: uuidv4(),
  }))

  state.visible = true
}

defineExpose({
  open,
})
</script>
