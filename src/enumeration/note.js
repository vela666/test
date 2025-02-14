import { getEnum } from '@/utils/dataProcessing.js'

export const noteBgColorList = [
  {
    type: 1,
    label: '#f5f7fe',
  },
  {
    type: 2,
    label: '#fefce2',
  },
  {
    type: 3,
    label: '#e3f0ff',
  },
  {
    type: 4,
    label: '#becaf6',
  },
  {
    type: 5,
    label: '#fdecd5',
  },
  {
    type: 6,
    label: '#f19ea8',
  },
  {
    type: 7,
    label: '#e8cfff',
  },
]

export const noteTitleFontSizeList = [
  {
    type: 1,
    label: '28px',
  },
  {
    type: 2,
    label: '24px',
  },
  {
    type: 3,
    label: '20px',
  },
  {
    type: 4,
    label: '16px',
  },
]

export const noteBgColorListMap = getEnum({
  data: noteBgColorList,
})

export const noteTitleFontSizeListMap = getEnum({
  data: noteTitleFontSizeList,
})
