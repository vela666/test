import {
  filterArraySpecifiedKey,
  getButtonAuthList,
} from '@/utils/dataProcessing'

export const { authEnum, authEnumDesc } = getButtonAuthList('user-cluster:')

const operateType = ['upd', 'del', 'add', 'exportIdConfig']

export const operateAuth = !Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
).length
