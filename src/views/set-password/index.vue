<script setup>
import { ref, reactive, onMounted } from 'vue'
import imgsrc from '@/assets/images/esspro_logo.png'
import { pwdReg } from '@/utils/validate'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { handleVerifyLink, handleActive } from '@/api/modules/user'
import { Base64 } from 'js-base64'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数
defineOptions({
  name: 'ResetPassword',
})

const route = useRoute()
const router = useRouter()
const formData = reactive({
  newPwd: '',
  confirmPwd: '',
})
const linkCode = ref('')
const account = ref('')
const errMessage = ref('')
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
  newPwd: [{ required: true, trigger: 'blur', validator: validateNewPwd }],
  confirmPwd: [
    { required: true, trigger: 'blur', validator: validateConfirmPass },
  ],
}

const initLoading = ref(false)
const loading = ref(false)

onMounted(() => {
  linkCode.value = route?.query?.linkCode || ''
  initLoading.value = true
  handleVerifyLink({ linkCode: linkCode.value })
    .then((res) => {
      if (res.code === 200 && res.data) {
        account.value = res.data?.account
      } else {
        errMessage.value = res.message
      }
    })
    .finally(() => {
      initLoading.value = false
    })
})

// 提交表单重置密码
const handleSubmit = () => {
  resetPwd.value.validate(async (valid) => {
    if (valid) {
      // 表单验证成功
      loading.value = true
      try {
        const res = await handleActive({
          activeCode: linkCode.value,
          password: Base64.encode(formData.newPwd),
        })
        if (res.code === 200) {
          ElMessage({
            message: t('login.accountActivationSuccessful'),
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
  <div v-loading="initLoading">
    <div class="reset-pwd">
      <img :src="imgsrc" class="eas__logo" />
      <span v-if="!errMessage">
        {{ $t('login.activateAccount', [account ? `【${account}】` : '']) }}
      </span>
      <span v-else class="cff9f24">{{ errMessage }}</span>
      <el-form
        ref="resetPwd"
        :model="formData"
        :rules="rules"
        label-position="top"
        size="large"
        class="reset-pwd__form">
        <el-form-item prop="newPwd" style="margin-bottom: 32px">
          <el-input
            v-model.trim="formData.newPwd"
            maxlength="50"
            autocomplete="off"
            :placeholder="$t('rules.enterNewPassword')"
            type="password"
            show-password
            auto-complete="new-password"
            :disabled="!!errMessage" />
        </el-form-item>
        <el-form-item prop="confirmPwd" style="margin-bottom: 30px">
          <el-input
            v-model.trim="formData.confirmPwd"
            maxlength="50"
            autocomplete="off"
            :placeholder="$t('rules.enterNewPasswordAgain')"
            type="password"
            show-password
            auto-complete="new-password"
            :disabled="!!errMessage" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="submit_btn"
            :disabled="!!errMessage"
            :loading="loading"
            @click="handleSubmit">
            {{ $t('btn.submit') }}
          </el-button>
        </el-form-item>
        <div class="form-primary">
          <div style="line-height: 18px">
            <span class="mb5">{{ $t('login.passwordRules') }}</span>
            {{ $t('rules.passwordLength') }}
          </div>
        </div>
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

%text-color-primary {
  color: var(--eas-text-color-primary);
}

%border-radius {
  border-radius: var(--eas-border-radius);
}

.submit_btn {
  width: 100%;
  @extend %border-radius;
}

.form-primary {
  padding: 10px;
  font-size: var(--eas-font-size-small);
  @extend %text-color-primary;
  background-color: var(--eas-color-primary-light-1);
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
