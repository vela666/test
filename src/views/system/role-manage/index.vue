<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.roleName"
        :desc="$t('system.roles.searchRoleName')"
        class="w220" />
    </template>
    <template #hr>
      <Auth :value="authEnum.add">
        <template #default="{ title }">
          <el-button @click="addOrEdit()" type="primary">
            <SvgIcon name="add1" class="fz16 mr3" />
            {{ title }}</el-button
          >
        </template>
      </Auth>
    </template>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom"
      :data="state.pagedData"
      border>
      <el-table-column
        v-for="column of columns"
        :prop="column.prop"
        :key="column.label"
        :label="column.label"
        :show-overflow-tooltip="!!column.prop">
        <template #default="{ row }">
          <template v-if="column.operate">
            <Auth :value="authEnum.upd">
              <template #default="{ title }">
                <el-button @click="addOrEdit(row)" type="primary" text>{{
                  title
                }}</el-button>
              </template>
            </Auth>
            <Auth :value="authEnum['binging-user']">
              <template #default="{ title }">
                <el-button
                  @click="buttonExecuteOperation({ type: 'viewMembers', row })"
                  type="primary"
                  text
                  >{{ title }}</el-button
                >
              </template>
            </Auth>

            <Auth :value="authEnum.del">
              <template #default="{ title }">
                <el-button
                  @click="buttonExecuteOperation({ type: 'deleteData', row })"
                  type="primary"
                  text>
                  {{ title }}
                </el-button>
              </template>
            </Auth>
          </template>

          <template v-else>
            {{ row[column.prop] }}
          </template>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <Pagination
        v-model:limit="pageConfig.pageSize"
        v-model:page="pageConfig.page"
        :total="pageConfig.total"
        @getData="handleTableData" />
    </template>
  </CommonLayout>
  <CommonDrawer
    @submit="addOrEditSubmit"
    @close="resetData"
    size="600px"
    :loading="state.operateLoading"
    v-model="state.addOrEditDialog"
    :title="`${state.formData.roleId ? $t('btn.edit') : $t('btn.add')} ${$t('system.roles.role')}`">
    <el-form
      ref="addOrEditRef"
      :rules="formRules"
      label-position="top"
      :model="state.formData">
      <el-form-item :label="$t('system.roles.roleName')" prop="roleName">
        <el-input
          clearable
          maxlength="50"
          show-word-limit
          :placeholder="$t('common.pleaseEnter')"
          v-model.trim="state.formData.roleName" />
      </el-form-item>
      <el-form-item :label="$t('common.description')">
        <el-input
          clearable
          type="textarea"
          :rows="6"
          maxlength="200"
          resize="none"
          show-word-limit
          :placeholder="$t('common.pleaseEnter')"
          v-model="state.formData.description" />
      </el-form-item>
      <el-form-item
        :label="$t('system.roles.menuPermission')"
        class="nd-form-item">
        <div class="flex-column w100-percentage">
          <div>
            <el-switch v-model="state.formData.autoJoinSwitch" />
            <span class="fz14 c545e6e ml10">
              {{ $t('system.roles.autoJoinRole') }}
            </span>
          </div>

          <div class="nd-tree-border">
            <el-checkbox
              v-model="state.selectAllMenu"
              :indeterminate="state.isIndeterminate"
              class="ml10"
              @change="selectAllMenuChange">
              {{ $t('common.selectAll') }}
            </el-checkbox>
            <el-tree
              ref="treeRef"
              :props="{
                label: 'title',
              }"
              default-expand-all
              :data="treeData"
              show-checkbox
              node-key="id"
              @check="treeCheck" />
          </div>
        </div>
      </el-form-item>
    </el-form>
  </CommonDrawer>
  <CommonDrawer
    size="900px"
    :loading="state.operateLoading"
    v-model="state.viewMembersDialog"
    :title="$t('system.roles.viewMembers')"
    :showBtn="false">
    <div class="c545e6e fz14 mb20">
      <div class="mb5">
        <span>{{ $t('system.roles.role') }}：</span>
        <span>{{ state.viewMembersInfo.roleName }}</span>
      </div>
      <div>
        <span>{{ $t('system.roles.roleDescription') }}：</span>
        <span>
          {{ state.viewMembersInfo.description }}
        </span>
      </div>
    </div>
    <div>
      <div class="nd-title mb15">{{ $t('system.roles.roleMembers') }}</div>
      <el-table class="nd-table-custom" :data="state.viewMembersList" border>
        <el-table-column
          v-for="column of viewMembersColumns"
          :prop="column.prop"
          :key="column.label"
          :label="column.label"
          :show-overflow-tooltip="!!column.prop">
          <template #default="{ row }">
            <template v-if="column.operate">
              <Auth :value="authEnum['unbinding-user']">
                <template #default="{ title }">
                  <el-button
                    @click="
                      buttonExecuteOperation({
                        type: 'removeMember',
                        otherRow: row,
                      })
                    "
                    type="primary"
                    text
                    >{{ title }}</el-button
                  >
                </template>
              </Auth>
            </template>
            <span
              :class="memberStatusTypeMap[row[column.prop]].class"
              v-else-if="column.prop === 'status'">
              {{ memberStatusTypeMap[row[column.prop]].label }}
            </span>

            <template v-else>
              {{ row[column.prop] }}
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </CommonDrawer>
  <TipDialog
    iconType="3"
    btnSwap
    :loading="state.tipLoading"
    v-model="state.tipDialog"
    :title="tipDialogOption.title"
    @submit="
      buttonExecuteOperation({ type: tipDialogOption.type, submit: true })
    ">
    {{ tipDialogOption.content }}
  </TipDialog>
</template>

<script setup>
import useState from './hooks/useState'
import role from '@/enumeration/role'
import { authEnum, operateAuth } from './enum.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数
const { memberStatusTypeMap } = role(t)

const formRules = {
  roleName: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger: ['blur', 'change'],
    },
  ],
  description: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger: ['blur', 'change'],
    },
  ],
}

const columns = [
  {
    prop: 'roleName',
    label: t('system.roles.roleName'),
  },
  {
    prop: 'description',
    label: t('common.description'),
  },
  {
    prop: 'createBy',
    label: t('common.createBy'),
  },
  {
    prop: 'updateBy',
    label: t('common.updateBy'),
  },
  {
    prop: 'updateTime',
    label: t('common.updateTime'),
  },
  {
    label: t('common.operate'),
    operate: true,
  },
].filter((item) => {
  if (item.operate && operateAuth) {
    return false
  }
  return true
})

const viewMembersColumns = [
  {
    prop: 'name',
    label: t('system.roles.userName'),
  },
  {
    prop: 'account',
    label: t('login.account'),
  },
  {
    prop: 'belongProject',
    label: t('system.roles.belongingProjectTeam'),
  },
  {
    prop: 'status',
    label: t('common.status'),
  },
  {
    label: t('common.operate'),
    operate: true,
  },
].filter((item) => {
  if (!authEnum['unbinding-user'] && item.operate) {
    return false
  }
  return true
})

const {
  state,
  pageConfig,
  filterConfig,
  tipDialogOption,
  treeData,
  treeRef,
  addOrEditRef,
  addOrEdit,
  treeCheck,
  resetData,
  handleTableData,
  addOrEditSubmit,
  selectAllMenuChange,
  buttonExecuteOperation,
} = useState(t)

defineOptions({
  name: 'RoleManage',
})
</script>

<style scoped lang="scss">
.nd-tree-border {
  border: 1px solid var(--eas-border-color-2);
  border-radius: 4px;
  //overflow-y: overlay;
}
</style>
