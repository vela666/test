// 角色成员状态
import { getEnum } from '@/utils/dataProcessing'

export default function (t) {
  const memberStatusList = [
    {
      type: 0,
      label: t('btn.normal'),
      class: 'success-status',
    },
    {
      type: 1,
      label: t('btn.disable'),
      class: 'fail-status',
    },
    {
      type: 2,
      // label: '密码错误锁定',
      label: t('btn.lock'),
      class: 'fail-status',
    },
    {
      type: 3,
      // label: '长时间未登录锁定',
      label: t('btn.lock'),
      class: 'fail-status',
    },
    {
      type: 4,
      label: t('btn.toBeActivated'),
      class: 'warning-status',
    },
    {
      type: 5,
      label: t('btn.resigned'),
      class: 'default-status',
    },
  ]

  const memberStatusTypeMap = getEnum({
    data: memberStatusList,
    needObjValue: true,
  })

  const memberType = [
    {
      // type: true,
      type: 0,
      label: t('system.members.internalMember'),
    },
    {
      type: 1,
      // type: false,
      label: t('system.members.partnership'),
    },
  ]

  const memberTypeMap = getEnum({
    data: memberType,
  })
  return {
    memberStatusList,
    memberStatusTypeMap,
    memberType,
    memberTypeMap,
  }
}
