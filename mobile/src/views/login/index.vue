<script setup>
import { ref, reactive, onMounted } from 'vue'
import { pwdReg } from '@/utils/validate'
import { WarningFilled } from '@element-plus/icons-vue'
import useUserStore from '@/store/modules/user'
import { useRoute, useRouter } from 'vue-router'
import AppLink from '@/layouts/components/AppLink/index.vue'
import { recordBehavior } from '@/utils/record-behavior.js'
import { domesticOverseasMark } from '@/utils/domesticOverseas.js'
import { joinCompany } from '@/api/modules/user'
import { ElMessage } from 'element-plus'
import { useLocaleHooks } from '@/components/SwitchLanguage/localeHooks'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数
import { isMobile } from '@/utils/mobile.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const initLoading = ref(false)
const loading = ref(false)
const loginForm = ref(null)
const formData = reactive({ userName: '', password: '', agree: false })
const loginRules = {
  userName: [
    { required: true, trigger: 'blur', message: t('rules.enterAccount') },
  ],
  password: [
    { required: true, trigger: 'blur', message: t('rules.enterPassword') },
  ],
}

const { locale } = useLocaleHooks()

// const locale = ref('zh-CN')

onMounted(() => {
  const activeCode = route?.query?.linkCode || ''
  if (activeCode) {
    initLoading.value = true
    joinCompany({ activeCode })
      .then((res) => {
        if (res.code === 200) {
          ElMessage.success(t('login.successfullyJoinedCompany'))
        }
      })
      .finally(() => {
        initLoading.value = false
      })
  }
})

/**
 * @description 判断是否是初次登录，然后跳转（是初次登录就跳转到应用列表页面）
 * @description 初次登录定义：账号在浏览器中的第一次登录，如果换了浏览器或者清除缓存，则算初次登录
 * @returns
 */
const firstLoginJump = async () => {
  await router.push(route.query.redirect?.toString() ?? '/')
}

const handleLogin = () => {
  loginForm.value.validate(async (valid) => {
    if (valid && formData.agree) {
      // 表单验证成功
      //新账号首次登录成功不跳转页面需要修改密码
      loading.value = true
      try {
        const res = await userStore.login({
          account: formData.userName,
          password: formData.password,
        })

        if (res && res.data) {
          await firstLoginJump()
        }
        recordBehavior({
          moduleName: '通用',
          submoduleName: '登录',
          operate: '登录',
        })
      } catch (error) {
        loading.value = false
      }
      loading.value = false
    } else {
      return false
    }
  })
}

domesticOverseasMark
defineOptions({
  name: 'Login',
})
</script>
<template>
  <div class="eas-login-container">
    <div>
      <div class="eas-official-website">
        <SwitchLanguage className="no-bg no-border" placement="bottom-start" />
        <app-link to="http://www.yifants.cn/easpro.html" class="ml20">
          <div class="eas-official-website__text">{{ $t('login.about') }}</div>
        </app-link>
      </div>
      <div class="eas-login-panel">
        <div class="eas-login-panel-content">
          <div
            :class="[
              'eas-login-desc',
              locale === 'zh' ? 'eas-login-desc_zh_bg' : 'eas-login-desc_bg',
            ]"></div>
          <div class="eas-login-content">
            <div class="eas-login-title">
              {{ $t('login.welcome') }} <span>2.0</span>
            </div>
            <el-form
              ref="loginForm"
              :model="formData"
              :rules="loginRules"
              class="eas-login-form"
              label-position="top">
              <el-form-item prop="userName" :label="$t('login.account')">
                <el-input
                  v-model.trim="formData.userName"
                  :placeholder="$t('rules.enterAccount')"
                  name="userName"
                  type="text"
                  tabindex="1"
                  auto-complete="on">
                  <template #prefix>
                    <span class="flex-center" style="color: #dcdfe6">
                      <svg-icon class="mr8" name="account" />
                      <span class="eas-login-line"></span>
                    </span>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item prop="password" :label="$t('login.password')">
                <el-input
                  ref="password"
                  v-model.trim="formData.password"
                  show-password
                  :placeholder="$t('rules.enterPassword')"
                  name="password"
                  tabindex="2"
                  auto-complete="on"
                  @keyup.enter="handleLogin">
                  <template #prefix>
                    <span class="flex-center" style="color: #dcdfe6">
                      <svg-icon class="mr8" name="password" />
                      <span class="eas-login-line"></span>
                    </span>
                  </template>
                </el-input>
              </el-form-item>
              <div class="forgot-password">
                <div
                  class="forgot-password__btn"
                  @click="$router.push('/reset-password')">
                  {{ $t('login.forgotPassword') }}
                </div>
              </div>
              <div class="eas-login-btn">
                <el-button
                  type="primary"
                  size="large"
                  :disabled="!formData.agree"
                  @click="handleLogin"
                  :loading="loading">
                  {{ $t('login.signIn') }}
                </el-button>
              </div>
              <div class="eas-privacy-agreement">
                <el-checkbox v-model="formData.agree" :disabled="loading">
                  {{ $t('login.readAndAgree') }}
                </el-checkbox>
                <a
                  class="retrieveBtn"
                  href="https://yifants.feishu.cn/wiki/Mgf5wqxlwiW8gLkM4HKcrlfFnLf"
                  target="_blank">
                  《{{ $t('login.privacyPolicy') }}》
                </a>
                <span :class="{ c5473e8: formData.agree }">{{
                  $t('login.and')
                }}</span>
                <a
                  class="retrieveBtn"
                  href="https://yifants.feishu.cn/wiki/CL7zwE1iYiYGwOkBPsecQQTfnIf"
                  target="_blank">
                  《{{ $t('login.userServiceAgreement') }}》
                </a>
              </div>
            </el-form>
          </div>
        </div>
      </div>
    </div>
    <div
      class="nd-about-info flex-center c545e6e"
      v-if="domesticOverseasMark() === 1">
      {{ $t('login.copyright') }} 一帆时空科技有限公司
      <a class="c5473e8 ml5" target="_blank" href="https://beian.miit.gov.cn/"
        >粤ICP备16060990号-2</a
      >
    </div>
  </div>
</template>
<style lang="scss" scoped>
.eas-login-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  min-height: 100%;
  background: var(--eas-white-bg-color);
  overflow: hidden;
  background-image: url('@/assets/images/login_bg.png');
  background-repeat: no-repeat;
  background-size: 100% 100%;
  min-width: 1440px;
}
.eas-official-website {
  display: flex;
  align-items: center;
  position: absolute;
  top: 20px;
  right: 50px;
  &__text {
    width: 66px;
    height: 21px;
    font-size: var(--eas-font-size-medium);
    font-weight: 400;
    color: var(--eas-text-color-primary);
    &:hover {
      color: var(--eas-color-primary);
    }
  }
}
.eas-login-panel {
  display: flex;
  width: 1100px;
  height: 560px;
  margin-top: 160px;
  box-shadow: 0px 10px 60px 1px rgba(28, 37, 72, 0.15);
  border-radius: 30px;
  align-items: center;
  justify-content: center;
  background: var(--eas-message-info-bg-color);
}
.eas-login-panel-content {
  display: flex;
  width: 1060px;
  height: 520px;
  border-radius: 20px;
}
.eas-login-desc {
  width: 620px;
  height: 520px;
  background-repeat: no-repeat;
  background-size: cover;
  &_zh_bg {
    background-image: url('@/assets/images/login_desc_zh.png');
  }
  &_bg {
    background-image: url('@/assets/images/login_desc.png');
  }
}
.eas-login-content {
  width: 440px;
  height: 520px;
  padding: 60px 53px;
  background: var(--eas-white-bg-color);
  border-radius: 0px 20px 20px 0px;
}
.nd-about-info {
  margin: 20px 0 10px 0;
}
.eas-login-title {
  position: relative;
  width: 310px;
  height: 35px;
  margin-bottom: 49px;
  font-weight: bold;
  font-size: var(--eas-font-size-26);
  color: var(--eas-text-color);
  &::after {
    position: absolute;
    bottom: -15px;
    left: 0;
    content: '';
    width: 100px;
    height: 4px;
    border-radius: 2px;
    background: var(--eas-color-primary);
  }
}
.eas-login-form {
  :deep(.el-input) {
    .el-input__wrapper {
      /* padding: 0px; */
      font-size: var(--eas-font-size-base);
      height: 40px;
      /* box-shadow: var(--eas-boder-bottom-box-shadow); */
      /* border-radius: 0px; */
      @-moz-document url-prefix() {
        input {
          // 去掉火狐记住密码的输入框的黄色背景
          box-shadow: 0 0 0 1000px white inset;
        }
      }
    }
  }
  :deep(.el-input__inner) {
    &::placeholder {
      padding-bottom: 21px;
    }
    &:-internal-autofill-previewed,
    &:-internal-autofill-selected {
      background-color: transparent;
      transition: background-color 999999999s ease-in-out 0s !important;
    }
  }
  :deep(.el-form-item) {
    &.is-error {
      /* .el-input__wrapper {
        box-shadow: var(--eas-boder-bottom-box-shadow-error);
      } */
    }
    .el-form-item__error {
      margin-top: 5px;
    }
    .el-form-item__label {
      color: var(--eas-text-color-light);
      font-size: 14px;
      &::before {
        display: none;
      }
    }
    .eas-login-line {
      width: 1px;
      height: 14px;
      border: 1px solid #edeff2;
      display: inline-block;
    }
  }
}
.forgot-password {
  display: flex;
  justify-content: flex-end;
  position: relative;
  margin-top: -13px;
  .forgot-password__btn {
    font-weight: 400;
    font-size: 14px;
    color: var(--eas-color-primary);
    cursor: pointer;
    &:hover {
      color: var(--eas-color-primary);
    }
  }
}
.eas-login-btn {
  width: 335px;
  height: 49px;
  margin-bottom: 10px;
  .el-button--large {
    width: 100%;
    --el-button-size: 49px;
    font-size: var(--eas-font-size-medium);
  }
}
.eas-privacy-agreement {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  .el-checkbox {
    color: var(--eas-text-color);
    font-weight: var(--eas-font-weight-400);
    :deep(.el-checkbox__inner) {
      border-radius: 50%;
    }
    :deep(.el-checkbox__label) {
      padding-left: 3px;
    }
  }
  a {
    text-decoration: none;
    color: var(--eas-color-primary);
  }
}

.eas-login-form {
  :deep(.el-input__suffix) {
    .el-input__password {
      color: var(--eas-border-color-3);
    }
  }
}
</style>
