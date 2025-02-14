import {
  filterArraySpecifiedKey,
  getButtonAuthList,
} from '@/utils/dataProcessing'

export const { authEnum } = getButtonAuthList('early-warn:')

const operateType = ['upd', 'del']

export const operateAuth = !Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
).length
