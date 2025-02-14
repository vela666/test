import searchResultTable from './searchResultTable.js'

export default function ({ resTableRef, props }) {
  const {
    state,
    getSortArr,
    handleResSortArr,
    getDataComponent,
    reCalculateData,
    handleDownload,
    chartTypeList,
    getExploreVisualData,
    getInfo,
    cancelCalculate,
    cancelRequest,
  } = searchResultTable({ resTableRef, props })

  const getData = async (options = {}) => {
    const { type = '' } = options
    try {
      await getDataComponent({ type })
    } catch (error) {
      console.log(error)
    }
  }

  const exportTableData = async () => {
    try {
      await handleDownload()
    } catch (error) {
      console.log(error)
    }
  }

  const handleRefresh = async () => {
    try {
      await reCalculateData(props.info)
    } catch (error) {
      console.log(error)
    }
  }

  return {
    state,
    getSortArr,
    handleResSortArr,
    getData,
    handleRefresh,
    exportTableData,
    chartTypeList,
    getExploreVisualData,
    getInfo,
    cancelCalculate,
    cancelRequest,
  }
}
