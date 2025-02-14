import {
  filterArraySpecifiedKey,
  getButtonAuthList,
} from '@/utils/dataProcessing'

export const { authEnum } = getButtonAuthList('role:')

const operateType = ['upd', 'del', 'binging-user']

export const operateAuth = !Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
).length
