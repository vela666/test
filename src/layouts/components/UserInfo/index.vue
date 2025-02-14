<script setup>
import { ArrowRight, Check } from '@element-plus/icons-vue'
import { ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useUserStore from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import {
  getSwitchCompanyList,
  asyncSwitchCompany,
  setDefaultCompany,
  addVersion,
} from '@/api/modules/user.js'
import { updateUrlParams } from '@/utils/index.js'
import { t } from '@/locales/i18n'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const props = defineProps({
  user: {
    type: Object,
  },
})
const companyList = ref([])
const userInfoDropdown = ref(null)
const showCompanySwitch = ref(false)
const companySwitchLoaing = ref(false)

// 切换到个人设置页面
const goToUserSetting = () => {
  userInfoDropdown.value.handleClose()
  // 个人设置页面
  router.push('/user-center')
}
// 添加多企业
const goToCompanyManage = () => {
  userInfoDropdown.value.handleClose()
  //todo 加入多企业
}
// 切换企业
const switchCompany = async (item) => {
  if (+item.status === 1) {
    ElMessage.warning(t('layouts.user.companyDisabled', [item.name]))
    return
  }
  if (item.chooseStatus) {
    // userInfoDropdown.value.handleClose()
    return
  }

  const { data } = await asyncSwitchCompany({
    id: item.id,
  })
  // 清除缓存、重新设置token
  userStore.resetUser()
  userStore.setToken(data)
  // 去掉地址后面的参数 例如看板后面的参数
  const href = window.location.href
  const pos = href.indexOf('?')
  const url = pos > -1 ? href.slice(0, pos) : href
  // 替换地址链接 然后重新加载当前页面
  window.location.replace(url)
  window.location.reload()
  userInfoDropdown.value.handleClose()
  //todo 切换企业
}
// 下拉框出现/隐藏时触发
const userDropdownChange = (val) => {
  if (!val) {
    showCompanySwitch.value = false
  }
}

// 显示切换企业
const showSwitchEnterprise = async (exec) => {
  if (exec) {
    showCompanySwitch.value = !showCompanySwitch.value
  }
  if (showCompanySwitch.value) {
    companySwitchLoaing.value = true
    const { data } = await getSwitchCompanyList().finally((_) => {
      companySwitchLoaing.value = false
    })
    companyList.value = data
  }
}

// 设置默认登录企业
const companySwitchChange = async (item) => {
  const chooseStatus = +item.defaultLongin === 1
  await setDefaultCompany({
    id: item.id,
    chooseStatus,
  })
  showSwitchEnterprise(false)
}
//退出登录
const logout = () => {
  history.replaceState(history.state, '', location.origin)
  // updateUrlParams()
  userStore.logout()
  userInfoDropdown.value.handleClose()
}

const userInfo = computed(() => userStore.userInfo)
const userText = computed(() => userInfo.value?.name?.slice(0, 1)?.trim())

const dialogVesionVisible = ref(false)
const loading = ref(false)
const ruleFormRef = ref(null)
const form = reactive({
  version: '',
})
const rules = reactive({
  version: [
    {
      required: true,
      message: t('layouts.user.enterVersion'),
      trigger: 'blur',
    },
    {
      min: 3,
      max: 50,
      message: t('layouts.user.lengthCharacters', [3, 50]),
      trigger: 'blur',
    },
  ],
})
const handleVesionDialogClose = (type) => {
  if (type !== 'save') {
    ruleFormRef.value.resetFields()
    dialogVesionVisible.value = false
    return
  }
  ruleFormRef.value.validate(async (valid) => {
    if (!valid) {
      return
    }
    loading.value = true
    addVersion({ version: form.version })
      .then((res) => {
        if (res.code === 200 && res.data) {
          ElMessage({
            type: 'success',
            message: t('layouts.user.versionModified'),
          })
          userStore.userInfo.version = form.version
          ruleFormRef.value.resetFields()
          dialogVesionVisible.value = false
        } else {
          ElMessage({
            type: 'error',
            message: res.message,
          })
          loading.value = false
        }
      })
      .finally(() => {
        loading.value = false
      })
  })
}

defineOptions({
  name: 'UserInfo',
})
</script>

<template>
  <el-dropdown
    trigger="click"
    placement="bottom-end"
    popper-class="eas-user-info"
    ref="userInfoDropdown"
    @visible-change="userDropdownChange">
    <div class="user-text-icon">{{ userText }}</div>
    <template #dropdown>
      <div class="user-info-menu">
        <div class="info-panel">
          <div class="info-panel-item">
            <span class="info-panel-title">
              {{ $t('layouts.user.currentUser') }}：
            </span>
            <span class="info-panel-content">{{ userInfo.name }}</span>
          </div>
          <div class="info-panel-item">
            <span class="info-panel-title">
              {{ $t('layouts.user.affiliatedCompany') }}：
            </span>
            <span class="info-panel-content">
              {{ userInfo.currentCompanyName }}
            </span>
          </div>
          <div class="info-panel-item" v-if="userInfo.valid">
            <span class="info-panel-title"
              >{{ $t('layouts.user.expirationDate') }}：</span
            >
            <span class="info-panel-content">
              {{ userInfo.valid }}
            </span>
          </div>
          <div class="info-panel-item">
            <span class="info-panel-title"
              >{{ $t('layouts.user.currentVersion') }}：</span
            >
            <span class="info-panel-content"> v{{ userInfo.version }} </span>
            <span
              class="c-pointer c5473e8"
              v-if="userInfo.type === 1"
              @click="
                () => {
                  dialogVesionVisible = true
                  form.version = userInfo.version
                }
              ">
              {{ $t('btn.edit') }}
            </span>
          </div>
        </div>
        <div class="user-setting">
          <div class="user-setting-area language">
            <SwitchLanguage
              style="width: 100%"
              :showBorder="false"
              type="custom"
              placement="left"
              :offset="12">
              <template #default>
                <div class="flex-center w100-percentage flex-between">
                  {{ $t('layouts.user.language') }}
                  <el-icon><ArrowRight /></el-icon>
                </div>
              </template>
            </SwitchLanguage>
          </div>
        </div>
        <div class="user-setting">
          <div
            :class="['user-setting-area', showCompanySwitch ? 'is-active' : '']"
            @click="showSwitchEnterprise(true)">
            <div class="flex-center w100-percentage flex-between">
              {{ $t('layouts.user.switchCompany') }}
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
        <div
          class="switch-company"
          v-show="showCompanySwitch"
          v-loading="companySwitchLoaing">
          <div class="switch-company-panel">
            <!--            <template v-if="companyList.length > 0">-->
            <el-scrollbar max-height="240px">
              <div
                v-for="item of companyList"
                :key="item.id"
                :class="[
                  'switch-company-item',
                  item.chooseStatus ? 'is-checked' : '',
                  +item.status === 1 ? 'nd-condition-disabled' : '',
                ]"
                @click="switchCompany(item)">
                <div class="flex-center flex-between">
                  <div v-showTips>
                    {{ item.name }}
                  </div>
                  <el-icon v-if="item.chooseStatus" class="ml10 mr5"
                    ><Check
                  /></el-icon>
                </div>
                <label
                  class="inline-flex flex-align-items-center c-pointer"
                  @click.stop>
                  <el-switch
                    @change="companySwitchChange(item)"
                    :active-value="1"
                    :inactive-value="0"
                    v-model="item.defaultLongin"
                    class="mr5" />{{ $t('layouts.user.defaultLogin') }}
                </label>
              </div>
            </el-scrollbar>
            <!--            </template>-->
            <!--            <div v-else class="no-company-list">
              <Empty />
            </div>-->
          </div>
          <div class="switch-company-footer">
            <a
              class="c5473e8"
              href="https://yifants.feishu.cn/wiki/J0cKwsXyEilVGRkVme0cMft4nDh"
              target="_blank">
              {{ $t('layouts.user.joinMultipleCompanies') }}
            </a>
          </div>
        </div>
        <div class="user-setting">
          <div class="user-setting-area" @click="goToUserSetting">
            <div>{{ $t('login.personalSettings') }}</div>
          </div>
        </div>
        <div class="exit-btn" @click="logout">
          <div class="exit-btn-text">
            <div>{{ $t('layouts.user.signOut') }}</div>
          </div>
        </div>
      </div>
    </template>
  </el-dropdown>

  <CommonDialog
    v-model="dialogVesionVisible"
    :title="$t('layouts.user.modifyVersionNumber')"
    alignCenter
    :loading="loading"
    :append-to-body="false"
    @submit="handleVesionDialogClose('save')"
    @close="handleVesionDialogClose()">
    <el-form
      :rules="rules"
      label-position="top"
      label-width="100px"
      ref="ruleFormRef"
      :model="form">
      <el-form-item :label="$t('layouts.user.versionNumber')" prop="version">
        <CommonInput
          :prefixSlot="false"
          clearable
          :placeholder="$t('layouts.user.enterVersion')"
          v-model.trim="form.version" />
      </el-form-item>
    </el-form>
  </CommonDialog>
</template>

<style scoped lang="scss">
.user-text-icon {
  width: 24px;
  height: 24px;
  color: var(--eas-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--eas-color-primary);
  margin: 6px 20px 6px;
  border-radius: 50% 50%;
  cursor: pointer;
}
.user-info-menu {
  border-radius: 0px;
  padding: 4px;
  font-size: var(--eas-font-size-base);
  color: var(--eas-text-color-2);
  .info-panel,
  .user-setting {
    border-bottom: 1px solid var(--eas-border-color-2);
  }
  .info-panel {
    padding: 6px 6px 0px 6px;

    &-item {
      margin-bottom: 10px;
    }
    &-title {
      color: var(--eas-text-color-light);
    }
    &-content {
      color: var(--eas-text-color-primary);
    }
  }
  .user-setting {
    padding: 4px 0px;
    cursor: pointer;
    &-area {
      padding: 10px 10px 11px 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      &:hover {
        color: var(--eas-color-primary);
        //background-color: var(--eas-color-primary-light-1);
      }
    }
  }
  .exit-btn {
    cursor: pointer;
    margin-top: 4px;
    &-text {
      padding: 10px 0px 11px 6px;
    }
    &:hover {
      color: var(--eas-color-primary);
      //background-color: var(--eas-color-primary-light-1);
    }
  }
}
.switch-company {
  position: absolute;
  top: 70px;
  left: -2px;
  width: 270px;
  //min-width: 250px;
  transform: translate(-100%, 0%);
  background-color: #fff;
  box-shadow: var(--eas-box-shadow-light);
  border-radius: var(--eas-border-radius-4);
  padding: 4px 0 0 4px;
  white-space: nowrap;
  &-panel {
    //min-height: 125px;
    max-height: 240px;
    :deep(.el-scrollbar) {
      .el-scrollbar__bar {
        &.is-vertical {
          right: 0;
        }
      }
    }
  }
  &-item {
    //display: flex;
    //flex-direction: column;
    //justify-content: space-between;
    //height: 40px;
    padding: 10px 10px 11px 6px;
    margin-right: 6px;
    font-size: var(--eas-font-size-base);
    color: var(--eas-text-color-primary);
    cursor: pointer;
    &:hover {
      &:not(.nd-condition-disabled) {
        color: var(--eas-color-primary);
        background-color: var(--eas-color-primary-light-1);
      }
    }
  }
  &-footer {
    height: 44px;
    padding: 12px 0 12px 6px;
    margin-top: 4px;
    border-top: 1px solid var(--eas-border-color-2);
  }
}
.no-company-list {
  height: 125px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.is-active,
.is-checked {
  color: var(--eas-color-primary);
  background-color: var(--eas-color-primary-light-1);
}
:deep() {
  .language {
    > div {
      width: 100%;
    }
  }
}
</style>
<style lang="scss">
.el-popper {
  &.eas-user-info {
    min-width: 250px;
    min-height: 162px;
    > .el-scrollbar {
      overflow: visible;
    }
  }
}
</style>
