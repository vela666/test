import { defineStore } from 'pinia'
import { ref } from 'vue'
import { timeZoneListMap } from '@/enumeration/report.js'
export default defineStore('timeZone', () => {
  const bool = !timeZoneListMap[localStorage.getItem('timeZone')]
  const temp = bool ? '8' : localStorage.getItem('timeZone')
  localStorage.setItem('timeZone', temp)

  const timeZone = ref(temp)

  return { timeZone }
})
