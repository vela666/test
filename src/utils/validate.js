import { t } from '@/locales/i18n'
// 登录页账号、密码表单验证
export const validateUserName = (rule, value, callback) => {
  // const reg = /^([a-zA-Z0-9_-]+(\.?[a-zA-Z0-9_]+)+)@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/
  //   .@兼容历史邮箱登录方式
  const reg = /^[0-9a-zA-Z_.@]+$/
  if (!value) {
    callback(new Error(t('rules.enterAccount')))
  } else if (!reg.test(value)) {
    callback(new Error(t('rules.onlyContainName')))
  } else if (value.length > 50 || value.length < 3) {
    callback(new Error(t('rules.lengthRange')))
  } else {
    callback()
  }
  callback()
}

export const pwdReg =
  // eslint-disable-next-line no-useless-escape
  /^(?![a-z]+$)(?![A-Z]+$)(?![0-9]+$)(?![!-\/:-@\[-`\{-~]+$)[a-zA-Z0-9!-\/:-@\[-`\{-~]{8,16}$/
export const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error(t('rules.enterPassword')))
  } else if (!pwdReg.test(value)) {
    callback(new Error(t('rules.passwordLength')))
  } else {
    callback()
  }
}

// 邮箱正则
export const emailReg = /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/
// 邮箱验证器
export const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback(new Error(t('rules.enterEmailAddress')))
  } else if (!emailReg.test(value)) {
    callback(new Error(t('rules.emailFormatError')))
  } else {
    callback()
  }
}

/**
 * @description 校验邮箱
 * @param {String} email 邮箱
 * @returns {Boolean}
 */
export function isEmail(email) {
  // return /^[a-zA-Z0-9\u4e00-\u9fa5_-]+@[a-zA-Z0-9\u4e00-\u9fa5_-]+(\.[a-zA-Z0-9\u4e00-\u9fa5_-]+)+$/.test(email);
  return /^.+@.+$/.test(email)
}

// 登陆账号 仅支持 英文、特殊字符、数字 $符号是子账号格式，不可输入
export function isAccount1(val) {
  return /^[a-zA-Z0-9!@#%^&*()_+,.?~=-]+$/.test(val)
}

// 必须以字母开头，只能包含数字，字母和下划线"_"
export function validIdentifierRegex(val) {
  return /^[a-zA-Z]\w*$/.test(val)
}
// 必须以小写字母开头，只能包含：数字，小写字母和下划线“_”
export function validIdentifierRegex1(val) {
  return /^[a-z][a-z0-9_]*$/.test(val)
}
