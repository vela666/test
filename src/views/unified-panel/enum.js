import {
  getButtonAuthList,
  filterArraySpecifiedKey,
} from '@/utils/dataProcessing'

// const userStore = useUserStore()

// const operateType = ['addDash', 'addFile', 'addSpace']
const operateType = ['addDash', 'addFile']
export const { authEnum, authEnumDesc } = getButtonAuthList('unified-panel:')
export const operateAuth = Object.values(
  filterArraySpecifiedKey(authEnum, operateType)
)

export const kanbanSelectKey = 'unifiedPanelId'
