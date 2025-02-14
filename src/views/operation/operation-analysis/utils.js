import { t } from '@/locales/i18n'

export const displayMode = (type = 'barstack') => {
  const data = [
    { value: 'table', title: t('chart.dataTable'), icon: 'chart-table' },
  ]

  if (type === 'barstack') {
    data.unshift({
      value: 'barstack',
      title: t('chart.barStack'),
      icon: 'chart-stackbar',
    })
  } else if (type === 'line') {
    data.unshift({
      value: 'line',
      title: t('chart.trend'),
      icon: 'chart-trend',
    })
  } else {
    data.unshift({
      value: 'bar',
      title: t('chart.bar'),
      icon: 'chart-transform',
    })
  }
  return data
}

export const mapFooterData = (columns) => {
  return [
    columns.reduce((p, c) => {
      p[c.prop] = c.footer
      return p
    }, {}),
  ]
}

export const userState = {
  0: {
    label: '正常',
    color: '#5473e8',
    alias: 'normal',
  },
  1: {
    label: '待激活',
    color: '#ff9f24',
    alias: 'toBeActivated',
  },
  // (密码错误锁定、长时间未登录锁定)
  2: {
    label: '锁定',
    color: '#cbd0d6',
    alias: 'lock',
  },
  3: {
    label: '禁用',
    color: '#f56c6c',
    alias: 'disable',
  },
}
