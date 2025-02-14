import { t } from '@/locales/i18n'

// 名称
export const validateName = (rule, value, callback) => {
  if (!value.trim()) {
    callback(new Error(t('dataManagement.rules.nameInputRules')))
  } else if (/\s+/.test(value)) {
    callback(new Error(t('dataManagement.rules.nameSpaceRules')))
  } else if (!/^[a-z0-9]+$/.test(value)) {
    callback(new Error(t('dataManagement.rules.nameValidRules')))
  } else {
    callback()
  }
}

// 字段名
export const validateFieldName = (rule, value, callback) => {
  if (!value.trim()) {
    callback(new Error(t('dataManagement.rules.fieldNameInputRules')))
  } else if (/\s+/.test(value)) {
    callback(new Error(t('dataManagement.rules.fieldNameSpaceRules')))
  } else if (!/^(?!^\d)[a-z\d_]+$/.test(value)) {
    callback(new Error(t('dataManagement.rules.fieldNameValidRules')))
  } else if (value.length > 30) {
    callback(new Error(t('dataManagement.rules.lengthRules', [30])))
  } else {
    callback()
  }
}

// 显示名
export const validateDisplayName = (rule, value, callback) => {
  if (!value.trim()) {
    callback(new Error(t('common.pleaseEnter')))
  } else if (/\s+/.test(value)) {
    callback(new Error(t('dataManagement.rules.displayNameSpaceRules')))
  } else if (value.length > 30) {
    callback(new Error(t('dataManagement.rules.lengthRules', [30])))
  } else {
    callback()
  }
}
