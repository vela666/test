<template>
  <DropDownPopoverSelection
    trigger="click"
    placement="bottom"
    :disabled="!row.length"
    @show="showPopover">
    <span class="c5473e8 c-pointer">
      <slot></slot>
    </span>
    <template #content>
      <div
        class="popover-list"
        @click="openDetails(item)"
        v-for="item of reportList"
        :key="item.id">
        {{ item.name }}
      </div>
    </template>
  </DropDownPopoverSelection>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { analysisPathMap, reportTypeListMap } from '@/enumeration/report'
import useStoreRoute from '@/store/modules/route'
// import { selectUsedReportList } from '@/api/user-tag'
const router = useRouter()
const { routes } = useStoreRoute()
const props = defineProps({
  row: {
    type: Array,
    default() {
      return []
    },
  },
})
const reportList = ref([])

const showPopover = () => {
  getSelectUsedReportList()
}
const getSelectUsedReportList = async () => {
  if (props.row && props.row.length) {
    reportList.value = props.row.reduce((pre, cur, index) => {
      pre.push({
        name: cur.name,
        id: cur.id,
        reportType: cur.reportType,
        businessId: cur.businessId,
      })
      return pre
    }, [])
  }
}

const openDetails = (item) => {
  /* if (!item.clickFlag) return */
  const reportTypeName = reportTypeListMap[item.reportType]
  const found = analysisPathMap.find(
    (item) => item.title.toLowerCase() === reportTypeName.toLowerCase()
  )
  if (found) {
    const { href } = router.resolve({
      path: found.path,
      query: {
        id: item.id,
        virtualAppId: sessionStorage.getItem('appId'),
      },
    })
    window.open(href, '_blank')
  }
}

defineOptions({
  name: 'ReportNum',
})
</script>
<style lang="scss" scoped>
.el-popper.nd-drop-down-popover-selection {
  .popover-list:hover {
    color: var(--eas-color-primary);
  }
}
</style>
