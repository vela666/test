import {
  filterArraySpecifiedKey,
  getButtonAuthList,
} from '@/utils/dataProcessing'

export const { authEnum, authEnumDesc } = getButtonAuthList('user-label:')

const operateType = ['upd', 'del', 'add']

export const operateAuth = !Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
).length
