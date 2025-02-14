<script setup>
import { numberInputProcessing } from '@/utils/index.js'

defineOptions({
  name: 'CompanyManage',
})
import {
  versionOptions,
  versionEum,
  companyStatus,
  companyStatusEum,
  menuRoleEnum,
} from '@/enumeration/index'
import useCompany from './hooks/useCompany'
import CommonDrawer from '@/components/CommonDrawer/index.vue'

const {
  state,
  treeRef,
  treeData,
  treeCheck,
  selectAllChange,
  contractStatusChange,
  addCompanyContract,
  delCompanyContract,
  formRules,
  filterState,
  filterTableData,
  isEdit,
  openftDrawerVisible,
  openft,
  appList,
  openftLoading,
  openftFormRef,
  openftDrawerClose,
  openftSubmit,
  addOrEdit,
  role,
  formRef,
  commonDrawerClose,
  submitForm,
  tipDialogVisible,
  tipData,
  tipDialogClose,
  clickMore,
  confirmLoding,
  tipDialogSubmit,
  resetData,
  resetDialogVisible,
  resetDialogClose,
  copyResetInfo,
  host,
  roleList,
  roleLabelChange,
  loading,
  isReset,
} = useCompany()

const contractStatusList = {
  1: '试用',
  2: '正式',
  3: '到期',
  4: '中止(停止)',
}

const numInput = (v, item, key) => {
  let val = numberInputProcessing({ v, decimal: 0 })
  item[key] = val
}
</script>

<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterState.searchKey"
        desc="搜索企业名称、编号搜索"
        class="w220" />
    </template>
    <template #hr>
      <!-- 只有国内需要 -->
      <el-button type="primary" v-if="!['.com'].includes(host)" @click="openft">
        开通方投配置
      </el-button>
      <el-button type="primary" @click="addOrEdit(false)">
        <SvgIcon name="add1" class="fz16 mr3" />
        新建企业
      </el-button>
    </template>
    <el-table
      :data="filterTableData"
      border
      class="nd-table-custom"
      v-loading="state.loading">
      <el-table-column prop="name" label="企业名称" />
      <el-table-column prop="code" label="企业编号" />
      <el-table-column prop="companyType" label="企业类型">
        <template #default="scope">
          {{ scope.row.companyType === 0 ? '正式' : '测试' }}
        </template>
      </el-table-column>
      <el-table-column prop="supportVersion" label="版本">
        <template #header>
          <FilterDropdown
            :list="versionOptions"
            name="版本"
            v-model="filterState.version" />
        </template>
        <template #default="scope">
          {{ versionEum[scope.row.supportVersion] }}
        </template>
      </el-table-column>
      <el-table-column prop="memberNum" label="成员数" />
      <el-table-column prop="valid" label="有效期" />
      <el-table-column prop="account" label="账号" />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="createTime" label="创建时间" />
      <el-table-column prop="status" label="状态">
        <template #header>
          <FilterDropdown
            :list="companyStatus"
            name="状态"
            v-model="filterState.status" />
        </template>
        <template #default="scope">
          <span
            :class="[
              scope.row.status === 0 ? 'success-status' : 'fail-status',
            ]">
            {{ companyStatusEum[scope.row.status] }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <div class="eas-table-operation">
            <el-button
              text
              class="is-normal-button mr20"
              @click="addOrEdit(true, scope.row)"
              >编辑
            </el-button>
            <el-dropdown
              placement="bottom-end"
              popper-class="eas-more-button"
              @command="clickMore">
              <el-button text class="is-normal-button">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    :command="{ type: 'status', data: scope.row }">
                    {{ scope.row.status === 0 ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="scope.row.userStatus === 4"
                    :command="{ type: 'invite', data: scope.row }">
                    邀请激活
                  </el-dropdown-item>
                  <!-- <el-dropdown-item
                    :command="{ type: 'reset', data: scope.row }">
                    重置密码
                  </el-dropdown-item> -->
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
      <template #empty>
        {{ state.loading ? '正在加载' : '暂无数据' }}
      </template>
    </el-table>
  </CommonLayout>
  <CommonDrawer
    v-model="state.show"
    size="600px"
    ref="commonDrawerRef"
    :title="`${isEdit ? '编辑' : '新建'}企业`"
    @close="commonDrawerClose"
    @submit="submitForm"
    :loading="loading">
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      :model="state.formData"
      ref="formRef">
      <el-form-item label="企业名称" prop="companyName">
        <CommonInput
          :prefixSlot="false"
          clearable
          maxlength="50"
          show-word-limit
          placeholder="请输入企业名称"
          v-model="state.formData.companyName" />
      </el-form-item>
      <el-form-item label="企业管理员用户名" prop="managerUserName">
        <CommonInput
          :prefixSlot="false"
          clearable
          maxlength="50"
          show-word-limit
          placeholder="请输入企业管理员用户名"
          v-model="state.formData.managerUserName" />
      </el-form-item>
      <el-form-item label="企业管理员登录账号" prop="managerAccount">
        <CommonInput
          :prefixSlot="false"
          clearable
          maxlength="50"
          show-word-limit
          placeholder="请输入企业管理员登录账号"
          v-model="state.formData.managerAccount"
          :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="企业管理员邮箱" prop="email">
        <CommonInput
          :prefixSlot="false"
          clearable
          maxlength="50"
          show-word-limit
          placeholder="请输入企业管理员邮箱地址，可用于接收消息通知，找回密码"
          v-model="state.formData.email"
          :disabled="isEdit && state.isEmail" />
      </el-form-item>
      <el-form-item label="企业类型" prop="companyType">
        <el-radio-group v-model="state.formData.companyType">
          <el-radio :value="0">正式</el-radio>
          <el-radio :value="1">测试</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="版本" prop="version">
        <el-select
          v-model="state.formData.version"
          placeholder="请选择"
          style="width: 260px">
          <el-option
            v-for="item in versionOptions"
            :key="`version${item.type}`"
            :label="item.label"
            :value="item.type" />
        </el-select>
      </el-form-item>
      <el-form-item
        class="nd-company-contract"
        label="合同服务期"
        prop="companyContractList">
        <el-form-item
          class="nd-company-contract-item"
          v-for="(item, index) of state.formData.companyContractList"
          :key="index"
          label=""
          :prop="'companyContractList.' + index + '.date'"
          :rules="{
            required: true,
            message: '请选择',
            trigger: 'blur',
          }">
          <div class="flex-center gap10">
            <el-date-picker
              class="eas-date-picker w220"
              v-model="item.date"
              type="daterange"
              :clearable="false"
              :disabled="
                state.formData.companyContractList.length - 1 !== index
              "
              placeholder="请选择有效期"
              value-format="YYYY-MM-DD" />
            <el-select
              @change="contractStatusChange(item)"
              v-if="[1, 2].includes(item.contractStatus)"
              v-model="item.contractStatus"
              class="w80"
              :disabled="
                state.formData.companyContractList.length - 1 !== index
              ">
              <el-option label="试用" :value="1" />
              <el-option label="正式" :value="2" />
            </el-select>
            <div class="cff9f24" v-else>
              {{ contractStatusList[item.contractStatus] }}
            </div>
            <el-form-item
              v-if="item.contractStatus === 2"
              label=""
              class="mb0 nd-purchase-amount"
              :prop="'companyContractList.' + index + '.purchaseVolume'"
              :rules="{
                required: true,
                message: '请输入',
                trigger: 'blur',
              }">
              <span>购买量</span>
              <CommonInput
                :disabled="
                  state.formData.companyContractList.length - 1 !== index
                "
                v-model="item.purchaseVolume"
                :clearable="false"
                @change="(v) => numInput(v, item, 'purchaseVolume')"
                desc="请输入"
                class="w80"
                :prefixSlot="false" />
              <span>亿</span>
            </el-form-item>
            <el-button
              @click="delCompanyContract(index)"
              v-if="item.isDel && state.formData.companyContractList.length > 1"
              text
              type="primary">
              <SvgIcon name="delete1" />
            </el-button>
          </div>
        </el-form-item>
        <el-button @click="addCompanyContract" text type="primary">
          + 新增合同服务期
        </el-button>
      </el-form-item>
      <el-form-item label="有效期">
        <el-date-picker
          class="eas-date-picker w220"
          v-model="state.formData.valid"
          type="date"
          placeholder="请选择有效期"
          value-format="YYYY-MM-DD" />
      </el-form-item>
      <el-form-item :label="`${isEdit ? '菜单' : '角色'}权限`" prop="version">
        <el-radio-group
          v-model="role"
          class="eas-radio-group"
          @change="roleLabelChange">
          <el-radio-button
            v-for="roleItem in roleList"
            :label="roleItem"
            :value="roleItem"
            :key="roleItem"
            >{{ menuRoleEnum[roleItem] }}
          </el-radio-button>
        </el-radio-group>
        <div class="role-permission">
          <el-checkbox
            v-model="state.selectAll"
            :indeterminate="state.isIndeterminate"
            class="ml10"
            @change="selectAllChange">
            全选
          </el-checkbox>
          <el-tree
            class="eas-tree"
            ref="treeRef"
            :props="{
              label: 'title',
            }"
            :data="treeData"
            show-checkbox
            node-key="id"
            @check="treeCheck" />
        </div>
      </el-form-item>
    </el-form>
  </CommonDrawer>
  <TipDialog
    v-model="tipDialogVisible"
    :iconType="tipData.iconType"
    :title="tipData.title"
    btnSwap
    @submit="tipDialogSubmit"
    :loading="confirmLoding"
    @close="tipDialogClose">
    {{ tipData.text }}
  </TipDialog>
  <TipDialog
    iconType="1"
    v-model="resetDialogVisible"
    :title="`${isReset ? '重置密码' : '添加成功'}`"
    @close="resetDialogClose">
    <div>
      <div>{{ isReset ? '重置成功' : '企业账号添加成功,复制账号信息：' }}</div>
      <div>账号：{{ resetData.account }}</div>
      <div>密码：{{ resetData.password }}</div>
      <div>登录地址：{{ host }}</div>
    </div>
    <template #btn>
      <el-button type="primary" @click="copyResetInfo($event)">复制</el-button>
    </template>
  </TipDialog>
  <CommonDrawer
    v-model="openftDrawerVisible"
    size="600px"
    ref="openftDrawerRef"
    title="开通方投配置"
    @close="openftDrawerClose"
    @submit="openftSubmit"
    :loading="openftLoading">
    <el-form
      label-position="top"
      label-width="100px"
      :model="state.openftFormData"
      ref="openftFormRef">
      <el-form-item
        label="应用"
        prop="appId"
        :rules="[{ required: true, message: '请选择应用', trigger: 'change' }]">
        <el-tree-select
          v-model="state.openftFormData.appId"
          :data="appList"
          :render-after-expand="false"
          default-expand-all
          filterable
          placeholder="请选择"
          clearable>
        </el-tree-select>
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<style scoped lang="scss">
:deep(.eas-date-picker.el-input) {
  .el-input__prefix {
    display: none;
  }
}
.eas-radio-group {
  border-radius: var(--eas-border-radius-4);
}
.role-permission {
  width: 538px;
  min-height: 374px;
  margin-top: 10px;
  padding: 10px;
  //overflow-y: auto;
  border-radius: var(--eas-border-radius-4);
  border: 1px solid var(--eas-border-color-2);
}

.el-button.is-text {
  &.is-normal-button {
    color: var(--eas-color-primary);
  }
}
.eas-table-operation {
  display: flex;
  align-items: center;
}
.el-tree {
  &.eas-tree {
    :deep(.el-tree-node:focus > .el-tree-node__content),
    :deep(.el-tree-node__content):hover {
      background-color: var(--eas-color-primary-light-1);
    }
  }
}

.nd-company-contract {
  > :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.nd-purchase-amount {
  > :deep(.el-form-item__content) {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
</style>
