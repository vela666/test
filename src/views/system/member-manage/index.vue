<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.team"
        :desc="$t('system.members.searchDepartment')"
        class="w220" />
      <CommonInput
        v-model="filterConfig.searchCondition"
        :desc="$t('system.members.searchUserAll')"
        class="w270" />
    </template>
    <template #hr>
      <Auth
        v-if="userStore.userInfo.supportVersion === 3"
        :value="authEnum.add">
        <template #default>
          <el-button
            class="m0"
            @click="accountAsync"
            :disabled="!state.selectAllList.length">
            {{ $t('system.members.SetAccountSync') }}
          </el-button>
        </template>
      </Auth>

      <Auth :value="authEnum['department-manage']">
        <template #default="{ title }">
          <el-button class="m0" @click="teamManagement">
            <SvgIcon name="user1" class="fz16 mr3" />
            {{ title }}
          </el-button>
        </template>
      </Auth>

      <Auth :value="authEnum.add">
        <template #default="{ title }">
          <el-button
            class="m0"
            @click="buttonExecuteOperation({ type: 'addOrEdit' })"
            type="primary">
            <SvgIcon name="add1" class="fz16 mr3" />
            {{ title }}</el-button
          >
        </template>
      </Auth>
      <!--      <el-button class="m0" @click="inviteExternal" type="primary">
        邀请外部成员</el-button
      >-->
    </template>
    <el-table
      v-loading="state.exhibitLoading"
      row-key="newId"
      default-expand-all
      class="nd-table-custom"
      :data="state.pagedData"
      @selection-change="handleSelectionChange"
      border>
      <el-table-column type="selection" width="55" />
      <el-table-column
        v-for="column of columns"
        :prop="column.prop"
        :key="column.label"
        :label="column.label"
        :show-overflow-tooltip="!!column.prop">
        <template #header v-if="column.switch">
          <FilterDropdown
            v-model="filterConfig.status"
            :list="memberStatusList.filter((item) => item.type !== 3)"
            :name="column.label" />
        </template>
        <template #header v-else-if="column.prop === 'outsider'">
          <FilterDropdown
            v-model="filterConfig.outsiderFilter"
            :list="memberType"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <div
            v-if="!row.children && column.switch"
            :class="memberStatusTypeMap[row.status].class">
            {{ memberStatusTypeMap[row.status].label }}
          </div>
          <MoreChoices
            v-else-if="!row.children && column.operate && row.status !== 5"
            :data="row"
            @click="(type) => buttonExecuteOperation({ type, row })" />
          <template v-else-if="column.prop === 'outsider'">
            <el-popover
              v-if="row.partnerTagName"
              :width="210"
              placement="right"
              trigger="hover">
              <template #reference>
                <span>
                  {{ memberTypeMap[+row[column.prop]] }}
                </span>
              </template>
              <div class="fz14 c545e6e">
                {{ $t('system.members.partnerIdentification')
                }}{{ row.partnerTagName }}
              </div>
            </el-popover>
            <span v-else>
              {{ memberTypeMap[+row[column.prop]] }}
            </span>
          </template>
          <template v-else-if="column.prop === 'account'">
            <div class="flex-center">
              {{ row[column.prop] }}
              <el-tooltip
                v-if="
                  userStore.userInfo.supportVersion === 3 &&
                  row['dataSync'] === 2
                "
                class="item"
                effect="light"
                :content="$t('system.members.accountMsgSync')"
                placement="bottom-start">
                <span class="async-style ml5">
                  <span class="async-style-content">{{
                    $t('system.members.all')
                  }}</span>
                </span>
              </el-tooltip>
            </div>
          </template>
          <template v-else>
            {{ row[column.prop] }}
          </template>
        </template>
      </el-table-column>
    </el-table>
    <!--    <template #footer>
      <Pagination
        v-model:limit="pageConfig.pageSize"
        v-model:page="pageConfig.page"
        :total="pageConfig.total"
        @getData="handleTableData"
      />
    </template>-->
  </CommonLayout>
  <CommonDrawer
    @submit="addOrEditSubmit"
    @close="closeExecuteOperation('memberDialogClose')"
    size="600px"
    :loading="state.operateLoading"
    v-model="state.addOrEditDialog"
    :title="`${state.formData.userId ? $t('system.members.editMember') : $t('system.members.addNewMember')}`">
    <el-form
      ref="addOrEditRef"
      :rules="formRules"
      label-position="top"
      label-width="100px"
      :model="state.formData">
      <el-form-item
        :label="$t('system.members.department')"
        prop="departmentId">
        <el-select
          class="w100-percentage"
          v-model="state.formData.departmentId"
          filterable
          :placeholder="$t('common.pleaseSelect')">
          <el-option
            v-for="item of state.teamData"
            :key="item.code"
            :label="item.name"
            :value="item.code" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('system.roles.userName')" prop="name">
        <CommonInput
          :prefixSlot="false"
          maxlength="50"
          show-word-limit
          :placeholder="$t('common.pleaseEnter')"
          v-model="state.formData.name" />
      </el-form-item>
      <el-form-item :label="$t('login.account')" prop="account">
        <CommonInput
          :disabled="!!state.formData.userId"
          :prefixSlot="false"
          maxlength="50"
          show-word-limit
          :placeholder="$t('common.pleaseEnter')"
          v-model="state.formData.account" />
      </el-form-item>
      <el-form-item :label="$t('login.email')" prop="email">
        <CommonInput
          :disabled="!!state.formData.userId && state.isEmail"
          clearable
          :prefixSlot="false"
          maxlength="100"
          show-word-limit
          :placeholder="$t('system.members.emailCanUsed')"
          v-model="state.formData.email" />
      </el-form-item>
      <el-form-item :label="$t('common.type')" class="mb10">
        <el-radio-group v-model="state.formData.outsider">
          <el-radio
            :disabled="!!userStore.userInfo.partnerTagName"
            :value="false"
            >{{ $t('system.members.internalMember') }}</el-radio
          >
          <el-radio :value="true">{{
            $t('system.members.partnership')
          }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="state.formData.outsider"
        :label="$t('system.members.partnerIdentificationMsg')"
        prop="partnerTagName">
        <el-select
          :disabled="!!userStore.userInfo.partnerTagName"
          class="w100-percentage"
          v-model="state.formData.partnerTagName"
          allow-create
          default-first-option
          filterable
          @change="partnerChange"
          :placeholder="$t('common.pleaseEnterOrSelect')">
          <el-option
            v-for="(item, index) of state.partnerList"
            :key="index"
            :label="item"
            :value="item" />
        </el-select>
      </el-form-item>

      <el-form-item
        v-if="userStore.userInfo.supportVersion === 3"
        :label="$t('system.members.accountSync')"
        class="mb10">
        <el-switch
          v-model="state.formData.dataSync"
          :active-value="2"
          :inactive-value="1" />
        <span class="fz12 c86919d line-h-1-dot-5 ml10">
          {{
            $t('system.members.accountMsgSyncCreated', [
              domesticOverseasMark() === 1
                ? $t('common.abroad')
                : $t('common.domestic'),
            ])
          }}
          {{
            `${state.formData.userId ? $t('system.members.ifAccountCreated', [domesticOverseasMark() === 1 ? $t('common.abroad') : $t('common.domestic')]) : ''}`
          }}
        </span>
      </el-form-item>

      <el-form-item :label="$t('system.roles.role')" prop="roleIdList">
        <el-select
          class="w100-percentage"
          v-model="state.formData.roleIdList"
          multiple
          filterable
          collapse-tags
          :reserve-keyword="false"
          :max-collapse-tags="3"
          :placeholder="$t('common.pleaseSelect')">
          <el-option
            v-for="item of state.roleList"
            :key="item.roleId"
            :label="item.roleName"
            :value="item.roleId">
            <div v-showTips style="width: 500px">{{ item.roleName }}</div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        :label="$t('system.members.joinProjectTeam')"
        v-if="!state.formData.userId">
        <el-select
          class="w100-percentage"
          v-model="state.formData.projectIdList"
          multiple
          filterable
          clearable
          collapse-tags
          :reserve-keyword="false"
          :max-collapse-tags="3"
          :placeholder="$t('common.pleaseSelect')">
          <el-option
            v-for="item of state.projectGroupList"
            :key="item.projectId"
            :label="item.projectName"
            :value="item.projectId"
            :disabled="item.userType !== 1" />
        </el-select>
        <div class="fz12 c86919d mt5 line-h-1-dot-5">
          {{ $t('system.members.projectTeamTips') }}
        </div>
      </el-form-item>
    </el-form>
  </CommonDrawer>

  <CommonDialog
    @close="closeExecuteOperation('teamDialogClose')"
    v-model="state.teamDialog"
    :showBtn="false"
    :title="$t('system.members.departmentMgt')">
    <div
      v-for="(item, index) of state.teamData"
      :key="item.code"
      class="flex-center flex-between nd-team">
      <div class="w100-percentage">
        <CommonInput
          maxlength="30"
          :id="`team-input${index}`"
          show-word-limit
          v-if="item.edit"
          v-model="state.teamUpdName"
          :prefixSlot="false"
          class="w220" />
        <span v-else class="c545e6e fz14">
          {{ item.name }}
        </span>
      </div>
      <div class="flex-shrink-0 ml10 flex-center">
        <template v-if="item.edit">
          <el-button
            @click="teamExecuteOperation({ item, index, type: 'saveEdit' })"
            text
            class="p0"
            :disabled="!state.teamUpdName.trim().length"
            type="primary">
            {{ $t('btn.save') }}
          </el-button>
          <el-button
            @click="teamExecuteOperation({ item, index, type: 'cancelEdit' })"
            text
            type="primary">
            {{ $t('btn.cancel') }}
          </el-button>
        </template>
        <div v-else class="nd-operate">
          <SvgIcon
            @click="teamExecuteOperation({ item, index, type: 'showEdit' })"
            class="mr15 c-pointer c86919d"
            name="edit1" />
          <el-popconfirm
            v-if="state.teamData.length > 1"
            @confirm="
              () => teamExecuteOperation({ item, index, type: 'deleteTeam' })
            "
            :icon="WarningFilled"
            icon-color="#ff7d00"
            width="172"
            :title="$t('system.members.sureDeleteDepartment')">
            <template #reference>
              <SvgIcon class="c-pointer c86919d" name="delete1" />
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <div
      v-for="(item, index) of state.tempTeamAddList"
      :key="index"
      class="flex-center flex-between nd-team mt10">
      <div class="w100-percentage">
        <CommonInput
          maxlength="30"
          :id="`add-team-input${index}`"
          show-word-limit
          v-model="item.name"
          :prefixSlot="false" />
      </div>
      <div class="flex-shrink-0 ml10 flex-center">
        <el-button
          @click="
            teamExecuteOperation({
              item,
              index,
              type: 'addOrCancelTeam',
              add: true,
            })
          "
          text
          class="p0"
          :disabled="!item.name.trim().length"
          type="primary">
          {{ $t('btn.save') }}
        </el-button>
        <el-button
          @click="
            teamExecuteOperation({ item, index, type: 'addOrCancelTeam' })
          "
          text
          type="primary">
          {{ $t('btn.cancel') }}
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="addTeam" text type="primary">{{
        $t('system.members.addDepartment')
      }}</el-button>
    </template>
  </CommonDialog>
  <TipDialog
    iconType="3"
    btnSwap
    v-model="state.tipDialog"
    :title="tipDialogOption.title"
    :loading="state.operateLoading"
    @submit="
      buttonExecuteOperation({
        type: tipDialogOption.type,
        submit: true,
      })
    ">
    {{ tipDialogOption.content }}
  </TipDialog>
  <CommonDialog
    v-model="state.dialogVisible"
    width="550px"
    :title="$t('system.members.batchSetAccountSync')"
    :show-close="true"
    :need-footer="true"
    :loading="state.dialogLoading"
    @close="handleDialogClose"
    @submit="handleDialogSubmit">
    <template #default>
      <div class="set-user">
        <el-form
          ref="formRef"
          :model="state.formUserData"
          label-width="auto"
          label-position="top"
          size="default">
          <el-form-item>
            <template #label>
              {{
                $t('system.members.selectedMemberAccounts', [
                  state.selectList.length,
                ])
              }}
            </template>
            <div class="set-user-list p10">
              <div v-for="(item, index) in state.selectList" :key="index">
                <div class="flex-center flex-between set-user-list-li">
                  <div v-showTips>{{ item.name }}</div>
                  <SvgIcon
                    v-if="state.selectList.length > 1"
                    name="close1"
                    class="fz14 c-pointer"
                    @click="handleDelete(index)" />
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item
            v-if="userStore.userInfo.supportVersion === 3"
            :label="$t('system.members.accountSync')"
            class="mb10">
            <el-switch
              v-model="state.formUserData.dataSync"
              :active-value="2"
              :inactive-value="1" />
            <span class="fz12 c86919d line-h-1-dot-5 ml10">
              {{ $t('system.members.selectedMemberSyncMsg') }}
            </span>
          </el-form-item>
        </el-form>
      </div>
    </template>
  </CommonDialog>

  <UserDepart
    :ref="(ref) => (state.userResignRef = ref)"
    @getList="getUserList" />
</template>

<script setup>
import { ref } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import { isEmail, isAccount1 } from '@/utils/validate'
import MoreChoices from './components/MoreChoices.vue'
import UserDepart from './components/UserDepart.vue'
import useState from './hooks/useState'
import { authEnum, operateAuth } from './enum.js'
import { domesticOverseasMark } from '@/utils/domesticOverseas.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数
import rule from '@/enumeration/role'
const { memberStatusList, memberTypeMap, memberType, memberStatusTypeMap } =
  rule(t)

const validateEmail = (rule, value, callback) => {
  if (value && !isEmail(value)) {
    callback(new Error(t('rules.enterCorrectEmail')))
    return
  }
  callback()
}

const validateAccount = (rule, value, callback) => {
  if (!isAccount1(value)) {
    callback(new Error(t('rules.onlySupports')))
    return
  }
  callback()
}

const formRules = {
  departmentId: [
    {
      required: true,
      message: t('common.pleaseSelect'),
      trigger: ['blur', 'change'],
    },
  ],
  partnerTagName: [
    {
      required: true,
      message: t('common.pleaseEnterOrSelect'),
      trigger: ['blur', 'change'],
    },
  ],
  name: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger: ['blur', 'change'],
    },
  ],
  account: [
    {
      required: true,
      message: t('rules.onlySupports'),
      trigger: ['blur', 'change'],
    },
    // { min: 3, message: 'Length should be 3', trigger: 'blur' },
    { validator: validateAccount, trigger: ['blur', 'change'] },
  ],
  roleIdList: [
    {
      required: true,
      message: t('common.pleaseSelect'),
      trigger: ['blur', 'change'],
    },
  ],
  email: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger: ['blur', 'change'],
    },
    { validator: validateEmail, trigger: ['blur', 'change'] },
  ],
}

const currentUrl = window.location.origin
const columns = [
  {
    prop: 'departmentName',
    label: t('system.members.department'),
  },
  {
    prop: 'name',
    label: t('system.roles.userName'),
  },
  {
    prop: 'account',
    label: t('login.account'),
  },
  {
    prop: 'email',
    label: t('login.email'),
  },
  {
    prop: 'outsider',
    label: t('common.type'),
  },
  {
    prop: 'roleListStr',
    label: t('system.members.systemRole'),
  },
  {
    prop: 'belongProjectListStr',
    label: t('system.members.projectTeam'),
  },
  {
    prop: 'createBy',
    label: t('common.createBy'),
  },
  {
    prop: 'createTime',
    label: t('common.createTime'),
  },
  {
    prop: 'lastLoginTime',
    label: t('system.members.lastLoginTime'),
  },
  {
    // prop: 'status',
    label: t('common.status'),
    switch: true,
  },
  {
    label: t('common.operate'),
    operate: true,
  },
].filter((item) => {
  if (operateAuth && item.operate) {
    return false
  }
  return true
})
const copyRef = ref(null)

const {
  state,
  userStore,
  filterConfig,
  pageConfig,
  tipDialogOption,
  addOrEditRef,
  addTeam,
  partnerChange,
  teamManagement,
  // handleTableData,
  addOrEditSubmit,
  teamExecuteOperation,
  closeExecuteOperation,
  buttonExecuteOperation,
  accountAsync,
  formRef,
  handleSelectionChange,
  handleDelete,
  handleDialogClose,
  handleDialogSubmit,
  getUserList,
} = useState(t)

defineOptions({
  name: 'MemberManage',
})
</script>

<style scoped lang="scss">
:deep(.common-layout-main) {
  margin-bottom: 20px;
}
.nd-team {
  height: 32px;
  .nd-operate {
    .svg-icon {
      &:hover {
        color: var(--eas-color-primary);
      }
    }
  }
}
.flex-shrink-0 {
  height: 32px;
}

.set-user {
  &-list {
    width: 100%;
    height: 136px;
    border-radius: 4px;
    border: 1px solid var(--eas-border-color);
    overflow: auto;
    &-li {
      height: 32px;
      line-height: 32px;
      padding: 0 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      background: var(--eas-border-color);
    }
  }
}
.async-style {
  position: relative;
  font-size: 12px;
  width: 18px;
  height: 18px;
  line-height: 18px;
  border-radius: 8px;
  color: #fff;
  background: var(--eas-color-primary);
  display: inline-block;
  flex-shrink: 0;
  &-content {
    position: absolute;
    top: 0;
    left: 3px;
  }
}
</style>
