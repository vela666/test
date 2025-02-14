<template>
  <CommonLayout class="nd-group-layout">
    <div class="group-manage-left flex-column">
      <div class="flex-center flex-between mb16 pr30 pl10">
        <div class="c1c2028 txt-bold fz16">
          {{ $t('system.projectTeams.projectList') }}
        </div>
        <Auth :value="authEnum.add">
          <template #default="{ title }">
            <el-button type="primary" @click="addOrEditGruop()">
              <SvgIcon name="add1" class="fz16 mr3" />
              {{ title }}</el-button
            >
          </template>
        </Auth>
      </div>
      <CommonInput
        v-model="filterConfig.projectName"
        :desc="$t('system.projectTeams.searchProjectName')"
        class="w100-percentage mb20 pr30 pl10" />

      <section
        v-loading="state.exhibitLoading"
        v-show="filterGroupList.length"
        id="nd-group"
        class="flex-column gap20 h100-percentage group-content">
        <BaseCard
          :data-id="`${item.projectId}`"
          @click="switchGroup(item)"
          v-for="item of filterGroupList"
          :key="item.projectId"
          :item="item"
          :selected="item.projectId === state.groupActived.id">
          <div class="nd-operate">
            <Auth :value="authEnum.upd">
              <SvgIcon
                @click.stop="addOrEditGruop(item)"
                class="c-pointer elem-hover mr10"
                name="edit1" />
            </Auth>
            <Auth :value="authEnum.del">
              <SvgIcon
                @click.stop="removeGruop(true, item)"
                class="c-pointer elem-hover"
                name="delete1" />
            </Auth>
          </div>
        </BaseCard>
      </section>
      <div
        v-loading="state.exhibitLoading"
        v-show="!filterGroupList.length"
        class="flex-center flex-level-center h100-percentage c86919d">
        {{ $t('system.projectTeams.noProjectTeam') }}
      </div>
    </div>
    <div class="group-manage-right flex-column">
      <div class="flex-center flex-between mb23">
        <div class="c1f1f1f txt-bold fz14">
          {{ state.groupActived.name }}
        </div>
        <a
          class="c5473e8 fz14"
          :href="externalUrl.projectTeamUseGuide"
          target="_blank">
          {{ $t('system.projectTeams.learningUsageSkills') }}
        </a>
      </div>
      <template v-if="state.groupList.length">
        <div class="flex-center flex-between mb10">
          <el-radio-group
            @change="memberOrAppToggle"
            v-model="state.memberOrApp">
            <el-radio-button label="Member" value="Member">
              {{ $t('system.projectTeams.projectMembers') }}
            </el-radio-button>
            <el-radio-button label="App" value="App">
              {{ $t('system.projectTeams.projectApp') }}
            </el-radio-button>
          </el-radio-group>
          <el-button
            v-if="companyAdminOrProjectManager"
            @click="addAppOrMember"
            type="primary">
            <SvgIcon name="add1" class="fz16 mr3" />
            {{
              state.memberOrApp === 'App'
                ? $t('system.apps.addApp')
                : $t('system.members.addMember')
            }}</el-button
          >
        </div>
        <component
          :companyAdminOrProjectManager="companyAdminOrProjectManager"
          :selectedGruop="state.groupActived"
          :ref="(el) => setRefs(state.currentCompontent.name, el)"
          :is="state.currentCompontent" />
      </template>
      <Empty imgW="73px" v-else class="h100-percentage" />
    </div>
  </CommonLayout>
  <CommonDialog
    :loading="state.operateLoading"
    @submit="addOrEditGruopSubmit"
    @close="gruopDialogClose"
    v-model="state.addOrEditGruopDialog"
    :title="`${state.formData.projectId ? $t('system.projectTeams.editProjectTeam') : $t('system.projectTeams.addNewProjectTeam')}`">
    <el-form
      ref="formRef"
      :rules="formRules"
      label-position="top"
      :model="state.formData">
      <el-form-item
        :label="$t('system.projectTeams.projectTeamName')"
        prop="projectName">
        <CommonInput
          v-model="state.formData.projectName"
          :desc="$t('common.pleaseEnter')"
          :prefixSlot="false"
          maxlength="50"
          show-word-limit />
      </el-form-item>
      <el-form-item
        :label="$t('system.projectTeams.projectTeamLeader')"
        prop="projectManagerUserIdList">
        <el-select
          class="w100-percentage"
          v-model="state.formData.projectManagerUserIdList"
          multiple
          clearable
          filterable
          collapse-tags
          :reserve-keyword="false"
          :max-collapse-tags="3"
          :placeholder="$t('common.pleaseSelect')">
          <el-option
            v-for="item of state.projectManagerList"
            :key="item.userId"
            :label="item.name"
            :value="item.userId" />
        </el-select>
      </el-form-item>
    </el-form>
  </CommonDialog>
  <TipDialog
    iconType="3"
    btnSwap
    :loading="state.operateLoading"
    v-model="state.tipDialog"
    :title="tipDialogOption.title"
    @submit="removeGruop(false)">
    {{ tipDialogOption.content }}
  </TipDialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import useState from './hooks/useState'
import BaseCard from './components/BaseCard.vue'
import { externalUrl } from '@/enumeration'
import useUserStore from '@/store/modules/user'
import { authEnum } from './enum.js'
import { updateUrlParams } from '@/utils/index.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const route = useRoute()
const userStore = useUserStore()
// 是企业管理员或项目负责人
const companyAdminOrProjectManager = computed(() => {
  return userStore.userInfo.type === 2 || state.groupActived.userType === 1
})
const formRules = {
  projectName: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger: ['blur', 'change'],
    },
  ],
  projectManagerUserIdList: [
    {
      required: true,
      message: t('common.pleaseSelect'),
      trigger: ['blur', 'change'],
    },
  ],
}

const {
  state,
  filterConfig,
  filterGroupList,
  tipDialogOption,
  addOrEdit,
  formRef,
  setRefs,
  resetData,
  removeGruop,
  switchGroup,
  addOrEditGruop,
  addAppOrMember,
  gruopDialogClose,
  memberOrAppToggle,
  addOrEditGruopSubmit,
} = useState()

if (route.query.appJump) {
  if (authEnum.add) {
    addOrEditGruop()
    //去除url上的参数
    updateUrlParams()
  }
}
defineOptions({
  name: 'GroupManage',
})
</script>
<style scoped lang="scss">
.nd-group-layout {
  :deep(.common-layout-main) {
    display: flex;
  }
}
.group-manage-left {
  width: 312px;
  height: 100%;
  padding: 16px 0px 16px 0;
  border-right: 1px solid var(--eas-border-color);
  overflow: hidden;

  .group-content {
    position: relative;
    padding-right: 30px;
    padding-left: 10px;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
.group-manage-right {
  flex: 1;
  padding: 20px 10px 16px 30px;
  overflow: hidden;
}
</style>
