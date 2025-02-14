import {
  filterArraySpecifiedKey,
  getButtonAuthList,
} from '@/utils/dataProcessing'

export const { authEnum } = getButtonAuthList('event-field:')

const operateType = ['upd', 'del']

export const operateAuth = !Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
).length
