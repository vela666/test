<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Back } from '@element-plus/icons-vue'
import imgsrc from '@/assets/images/esspro_logo.png'
import { pwdReg } from '@/utils/validate'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  getUserMail,
  getEmailCode,
  handleResetPassword,
} from '@/api/modules/user'
import { Base64 } from 'js-base64'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数
defineOptions({
  name: 'ResetPassword',
})
const router = useRouter()
const formData = reactive({
  account: '',
  code: '',
  newPwd: '',
  confirmPwd: '',
})
const resetPwd = ref(null)
const validateNewPwd = (rule, value, callback) => {
  if (!value) {
    callback(new Error(t('rules.enterNewPassword')))
  } else if (!pwdReg.test(value)) {
    callback(new Error(t('rules.passwordLength')))
  } else {
    if (formData.confirmPwd !== '') {
      resetPwd.value.validateField('confirmPwd')
    }
    callback()
  }
}
const validateConfirmPass = (rule, value, callback) => {
  if (!value) {
    callback(new Error(t('rules.enterNewPassword')))
  } else if (value !== formData.newPwd) {
    callback(new Error(t('rules.reenterPassword')))
  } else {
    callback()
  }
}
const rules = {
  account: [
    { required: true, trigger: 'blur', message: t('rules.enterAccount') },
  ],
  code: [
    { required: true, trigger: 'blur', message: t('rules.enterEmailCode') },
  ],
  newPwd: [{ required: true, trigger: 'blur', validator: validateNewPwd }],
  confirmPwd: [
    { required: true, trigger: 'blur', validator: validateConfirmPass },
  ],
}

// 展示绑定邮箱
const showMail = ref(false)
const bindMail = ref('')
const showBindMail = computed(() => {
  let email = ''
  if (bindMail.value.length > 0) {
    const str = bindMail.value.split('@')
    email = `***@${str[1] ?? ''}`
    if (str[0]?.length > 3) {
      email = `${str[0].slice(0, 3)}${email}`
    }
  }
  return email
})
// 查找账号绑定邮箱
const searchAccountMail = async () => {
  if (formData.account) {
    //查找绑定邮箱
    const res = await getUserMail({ account: formData.account })
    if (res.code === 200 && res.data) {
      bindMail.value = res.data
      showMail.value = true
      disabledSend.value = false
    } else {
      resetAccountStatus()
    }
  } else {
    resetAccountStatus()
  }
}
const resetAccountStatus = () => {
  bindMail.value = ''
  showMail.value = false
  disabledSend.value = true
  timer.value = null
  showSend.value = true
}

const disabledSend = ref(true)
const TIME_COUNT = 60 // 倒计时60秒
const timer = ref(null)
const showSend = ref(true)
const count = ref(0)
// 验证码倒计时
const timeCount = () => {
  if (!timer.value) {
    count.value = TIME_COUNT
    showSend.value = false
    timer.value = setInterval(() => {
      if (count.value > 1 && count.value <= TIME_COUNT) {
        count.value--
      } else {
        showSend.value = true
        clearInterval(timer.value)
        timer.value = null
        if (!formData.account) {
          disabledSend.value = true
        }
      }
    }, 1000)
  }
}

const loading = ref(false)
// 获取验证码
const getVerificationCode = async () => {
  loading.value = true
  try {
    const res = await getEmailCode({ account: formData.account })
    if (res.code === 200) {
      timeCount()
    }
  } catch (error) {
    loading.value = false
  }
  loading.value = false
}

// 提交表单重置密码
const handleSubmit = () => {
  resetPwd.value.validate(async (valid) => {
    if (valid) {
      // 表单验证成功
      loading.value = true
      try {
        const res = await handleResetPassword({
          account: formData.account,
          password: Base64.encode(formData.newPwd),
          confirmPassword: Base64.encode(formData.confirmPwd),
          pwdCode: formData.code,
        })
        if (res.code === 200) {
          ElMessage({
            message: t('login.passwordResetSuccessful'),
            type: 'success',
          })
          await router.push('/login')
        }
      } catch (error) {
        loading.value = false
      }
      loading.value = false
    } else {
      return false
    }
  })
}
</script>

<template>
  <div>
    <div class="reset-pwd">
      <img :src="imgsrc" class="eas__logo" />
      <div class="back-btn">
        <el-button
          text
          :icon="Back"
          :title="$t('login.backSignIn')"
          @click="$router.push('/login')" />
        <span>{{ $t('login.resetPassword') }}</span>
      </div>
      <el-form
        ref="resetPwd"
        :model="formData"
        :rules="rules"
        label-position="top"
        size="large"
        class="reset-pwd__form">
        <el-form-item prop="account" style="margin-bottom: 30px">
          <div class="form__tips mb5">{{ $t('login.enterAccount') }}</div>
          <el-input
            v-model.trim="formData.account"
            :placeholder="$t('rules.enterAccount')"
            name="account"
            type="text"
            @blur="searchAccountMail"
            maxlength="50" />
        </el-form-item>
        <el-form-item prop="code">
          <div class="form__tips mail__tip" v-if="showMail">
            {{ $t('login.boundEmail') }}{{ showBindMail }}
          </div>
          <el-input
            v-model.trim="formData.code"
            :placeholder="$t('rules.enterEmailCode')"
            name="code"
            type="text"
            maxlength="20"
            class="code__input" />
          <el-button disabled class="code__btn" v-if="disabledSend">
            {{ $t('login.getVerificationCode') }}
          </el-button>
          <template v-else>
            <el-button
              type="primary"
              class="code__btn"
              v-if="showSend"
              @click="getVerificationCode"
              :loading="loading">
              {{ $t('login.getVerificationCode') }}
            </el-button>
            <div class="code__btn code__timer" v-else>
              {{ $t('login.secondsResend', [count]) }}
            </div>
          </template>
        </el-form-item>
        <el-form-item prop="newPwd" style="margin-bottom: 32px">
          <el-input
            v-model.trim="formData.newPwd"
            maxlength="50"
            autocomplete="off"
            :placeholder="$t('rules.enterNewPassword')"
            type="password"
            show-password
            auto-complete="new-password" />
        </el-form-item>
        <el-form-item prop="confirmPwd" style="margin-bottom: 30px">
          <el-input
            v-model.trim="formData.confirmPwd"
            maxlength="50"
            autocomplete="off"
            :placeholder="$t('rules.enterNewPasswordAgain')"
            type="password"
            show-password
            auto-complete="new-password" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="submit_btn"
            :loading="loading"
            @click="handleSubmit">
            {{ $t('btn.submit') }}
          </el-button>
        </el-form-item>
        <!-- <div class="form-warning">
          <div class="mb5">密码要求：</div>
          <div style="line-height: 18px">
            密码长度8-16位,需要至少包含大写字母、小写字母、数字、特殊符号中的两种。
          </div>
        </div> -->
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.eas__logo {
  margin: 157px 0px 44px 0px;
}
.reset-pwd {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.back-btn {
  display: flex;
  align-items: center;
  .el-button.is-text {
    color: var(--eas-color-primary);
    font-size: 24px;
    margin-right: 10px;
  }
  & > span {
    font-weight: 400;
    color: var(--eas-text-color);
    font-size: var(--eas-font-size-extra-large);
  }
}
%text-color-primary {
  color: var(--eas-text-color-primary);
}
.form__tips {
  height: 19px;
  line-height: 19px;
  @extend %text-color-primary;
  font-size: var(--eas-font-size-base);
}
.mail__tip {
  position: relative;
  margin-top: -24px;
}
.reset-pwd__form {
  width: 330px;
  margin-top: 24px;
  :deep(.el-input) {
    .el-input__wrapper {
      @-moz-document url-prefix() {
        input {
          // 去掉火狐记住密码的输入框的黄色背景
          box-shadow: 0 0 0 1000px white inset;
        }
      }
    }
  }
  :deep(.el-input__inner) {
    &:-internal-autofill-previewed,
    &:-internal-autofill-selected {
      background-color: transparent;
      transition: background-color 999999999s ease-in-out 0s !important;
    }
  }
}
.code__input {
  width: 170px;
  margin-right: 10px;
}
%border-radius {
  border-radius: var(--eas-border-radius);
}
.code__btn {
  width: 150px;
  @extend %border-radius;
}
.code__timer {
  height: 40px;
  text-align: center;
  border: 1px solid var(--eas-color-primary);
  color: var(--eas-color-primary);
  user-select: none;
}
.submit_btn {
  width: 100%;
  @extend %border-radius;
}
.form-warning {
  height: 73px;
  padding: 10px;
  font-size: var(--eas-font-size-small);
  @extend %text-color-primary;
  background-color: var(--eas-color-warning-light-1);
  @extend %border-radius;
}
:deep(.el-form-item__content) {
  .el-button {
    --el-button-disabled-text-color: var(--eas-message-close-color);
    --el-button-disabled-border-color: var(--eas-border-color-2);
  }
  .el-input__suffix {
    .el-input__password {
      color: var(--eas-border-color-3);
    }
  }
}
</style>
