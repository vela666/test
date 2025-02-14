import {
  filterArraySpecifiedKey,
  getButtonAuthList,
} from '@/utils/dataProcessing'

export const { authEnum, authEnumDesc } = getButtonAuthList('programme:')

const operateType = ['upd', 'del']

export const operateAuth = !Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
).length
