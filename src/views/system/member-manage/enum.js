import {
  filterArraySpecifiedKey,
  getButtonAuthList,
} from '@/utils/dataProcessing'

export const { authEnum, authEnumDesc } = getButtonAuthList('user:')

const operateType = ['upd', 'status', 'rest-password', 'resign']

export const operateAuth = !Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
).length
