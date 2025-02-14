import {
  filterArraySpecifiedKey,
  getButtonAuthList,
} from '@/utils/dataProcessing'

export const { authEnum } = getButtonAuthList('custom-table:')

const operateType = ['add', 'refresh', 'upd', 'del']

export const operateAuth = !Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
).length
