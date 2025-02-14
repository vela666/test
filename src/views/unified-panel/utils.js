// authority 1 查看者 2 协作者 3 管理者
import { t } from '@/locales/i18n.js'

export function convertProjectMembersData(data) {
  return Object.keys(data)
    .reduce(
      (acc, k) => {
        acc[0].children = data[k].map((item) => {
          return {
            ...item,
            newId: `${item.id}-${item.dataType}`,
            // 权限1表示仅查看，2表示可编辑，3表示管理员
            authority: 1,
          }
        })
        return acc
      },
      [
        {
          topLevel: true,
          name: t('system.members.member'),
          children: [],
        },
      ]
    )
    .map((item) => ({
      ...item,
      disabled: !item.children.length,
    }))
}
