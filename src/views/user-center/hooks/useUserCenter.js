import { ref, reactive, onMounted, computed } from 'vue'
import {
  modifyUserName,
  fetchEmailCode,
  bindEmailRequest,
  unBindEmailRequest,
  validateEmailRequest,
} from '@/api/modules/user'
import useUserStore from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import { validateEmail, pwdReg } from '@/utils/validate'
import { asyncGetShowToken, asyncGetCreateToken } from '@/api/modules/common.js'
import { t } from '@/locales/i18n'

const initState = () => ({
  show: false,
  loading: false,
  btnLoading: false,
  emailShow: false,
  pwdShow: false,
  formData: {
    userName: '',
  },
  emailFormData: {
    email: '',
    code: '',
  },
  pwdFormData: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
  expirationTime: '',
  token: '',
})
export default function () {
  const userStore = useUserStore()
  const userInfo = computed(() => userStore.userInfo)
  const state = reactive(initState())

  const tokenRef = ref()
  /** 修改用户名 **/
  const userFormRef = ref(null)
  const userNameFormRules = {
    userName: [
      {
        required: true,
        max: 50,
        message: t('rules.enterUserName'),
        trigger: 'blur',
      },
    ],
  }
  const handleModifyUserName = () => {
    state.show = true
    state.formData.userName = userInfo.value.name
  }

  const modifyUserNameSubmit = () => {
    userFormRef.value.validate(async (valid) => {
      if (valid) {
        state.loading = true
        try {
          const res = await modifyUserName({
            userName: state.formData.userName,
            userId: userInfo.value.userId,
          })
          if (res.code === 200) {
            ElMessage({
              message: t('login.userNameUpdatedSuccessful'),
              type: 'success',
            })
            state.show = false
            await userStore.getUserInfo()
          }
        } catch (error) {
          state.loading = false
        }
        state.loading = false
      }
    })
  }
  const userNameDialogClose = () => {
    Object.assign(state.formData, initState().formData)
  }

  /** 邮箱绑定相关操作 **/
  const emailType = ref(0) // 邮箱操作类型： 0,绑定邮箱; 1,解除绑定; 2,修改邮箱
  const validateOld = ref(false) //验证老邮箱
  const emailFormRef = ref(null)
  const emailTitle = computed(() => {
    let title = t('login.bindEmail')
    if (emailType.value == 1) {
      title = t('login.unbindEmail')
    } else if (emailType.value == 2) {
      title = validateOld.value
        ? t('login.editEmailAddress')
        : t('login.enterNewEmailAddress')
    }
    return title
  })
  const TIME_COUNT = 60 // 倒计时60秒
  const timer = ref(null)
  const showSend = ref(true)
  const count = ref(0)
  const emailFormRules = {
    email: [
      {
        required: true,
        max: 50,
        trigger: 'blur',
        validator: validateEmail,
      },
    ],
    code: [
      { required: true, message: t('rules.enterEmailCode'), trigger: 'blur' },
    ],
  }

  const emailDialogClose = () => {
    resetEmailForm()
    emailType.value = 0
  }
  const resetEmailForm = () => {
    Object.assign(state.emailFormData, initState().emailFormData)
    if (!timer.value) {
      clearInterval(timer.value)
    }
    showSend.value = true
    count.value = 0
  }
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
        }
      }, 1000)
    }
  }
  // 获取邮箱验证码
  const getVerificationCode = () => {
    emailFormRef.value.validateField(['email'], async (valid) => {
      if (!valid) return
      // 输入邮箱并验证格式成功后请求获取验证码
      state.btnLoading = true
      try {
        const res = await fetchEmailCode({
          email: state.emailFormData.email,
          verifyCodeType: 2,
        })
        if (res.code === 200) {
          timeCount()
        }
      } catch (error) {
        state.btnLoading = false
      }
      state.btnLoading = false
    })
  }
  // 绑定邮箱
  const bindEmail = () => {
    state.emailShow = true
  }
  // 解除邮箱绑定
  const unBindEmail = () => {
    state.emailFormData.email = userInfo.value.email
    state.emailShow = true
    emailType.value = 1
  }
  // 修改邮箱
  const modifyEmail = () => {
    validateOld.value = true
    state.emailFormData.email = userInfo.value.email
    state.emailShow = true
    emailType.value = 2
  }
  //绑定邮箱(解除绑定)请求 // 邮箱操作类型： 0,绑定邮箱; 1,解除绑定; 2,修改邮箱
  const emailOperationSubmit = () => {
    emailFormRef.value.validate(async (valid) => {
      if (!valid) return
      state.loading = true
      let requestUrl = bindEmailRequest
      let messageText = t('login.emailBindingSuccessful')
      if (emailType.value == 1) {
        requestUrl = unBindEmailRequest
        messageText = t('login.unbindEmailSuccessfully')
      } else if (emailType.value == 2) {
        requestUrl = validateOld.value ? validateEmailRequest : bindEmailRequest
        messageText = validateOld.value
          ? ''
          : t('login.emailSuccessfullyEdited')
      }
      try {
        const res = await requestUrl({
          userId: userInfo.value.userId,
          email: state.emailFormData.email,
          verifyCode: state.emailFormData.code,
        })
        if (res.code === 200) {
          if (emailType.value == 2 && validateOld.value) {
            validateOld.value = false
            resetEmailForm()
          } else {
            ElMessage({
              message: messageText,
              type: 'success',
            })
            state.emailShow = false
            await userStore.getUserInfo()
          }
        }
      } catch (error) {
        state.loading = false
      }
      state.loading = false
    })
  }

  /** 修改密码相关操作 **/
  const pwdFormRef = ref(null)
  const validateNewPassword = (rule, value, callback) => {
    if (!value) {
      callback(new Error(t('rules.enterNewPassword')))
    } else if (!pwdReg.test(value)) {
      callback(new Error(t('rules.passwordLength')))
    } else {
      if (state.pwdFormData.confirmPassword !== '') {
        pwdFormRef.value.validateField('confirmPassword')
      }
      callback()
    }
  }

  const validateConfirmPassword = (rule, value, callback) => {
    if (!value) {
      callback(new Error(t('rules.enterNewPassword')))
    } else if (value !== state.pwdFormData.newPassword) {
      callback(new Error(t('rules.reenterPassword')))
    } else if (!pwdReg.test(value)) {
      callback(new Error(t('rules.passwordLength')))
    } else {
      callback()
    }
  }
  const pwdFormRules = {
    currentPassword: [
      {
        required: true,
        trigger: 'blur',
        message: t('rules.enterOriginalPassword'),
      },
    ],
    newPassword: [
      { required: true, trigger: 'blur', validator: validateNewPassword },
    ],
    confirmPassword: [
      { required: true, trigger: 'blur', validator: validateConfirmPassword },
    ],
  }
  const handleModifyPassword = () => {
    state.pwdShow = true
  }

  const pwdDialogClose = () => {
    Object.assign(state.pwdFormData, initState().pwdFormData)
  }
  // 修改密码请求
  const modifyPasswordSubmit = () => {
    pwdFormRef.value.validate(async (valid) => {
      if (!valid) return
      state.loading = true
      try {
        const res = await userStore.updatePassword({
          userId: userInfo.value.userId,
          currentPassword: state.pwdFormData.currentPassword,
          newPassword: state.pwdFormData.newPassword,
          confirmPassword: state.pwdFormData.confirmPassword,
        })
        if (res.code === 200) {
          ElMessage({
            message: t('login.passwordEditedSuccessfully'),
            type: 'success',
          })
          state.pwdShow = false
          userStore.logout()
        }
      } catch (error) {
        state.loading = false
      }
      state.loading = false
    })
  }

  const getShowToken = async () => {
    const { data } = await asyncGetShowToken()
    if (data) {
      state.expirationTime = data.expirationTime
      state.token = data.token
    }
  }

  const getCreateToken = async (type) => {
    const {
      data: { expirationTime, token },
    } = await asyncGetCreateToken(type === 0 ? 1 : type)
    state.expirationTime = expirationTime
    state.token = token
    ElMessage.success(
      `${type === 0 ? t('analysis.funnel.produce') : type === 1 ? t('btn.refresh') : t('login.renewal')} Token ${t('common.successful')}`
    )
  }
  getShowToken()
  return {
    state,
    userInfo,
    tokenRef,
    userFormRef,
    userNameFormRules,
    handleModifyUserName,
    modifyUserNameSubmit,
    userNameDialogClose,
    emailTitle,
    emailFormRef,
    emailFormRules,
    bindEmail,
    getVerificationCode,
    showSend,
    count,
    emailType,
    emailOperationSubmit,
    validateOld,
    unBindEmail,
    modifyEmail,
    emailDialogClose,
    pwdFormRef,
    pwdFormRules,
    handleModifyPassword,
    pwdDialogClose,
    modifyPasswordSubmit,
    getCreateToken,
  }
}
