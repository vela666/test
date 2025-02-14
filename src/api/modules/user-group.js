import requset from '../index'

const reqPath = '/user-segmentation/cluster'

/**
 * @description SQL分群、标签的绑定的报表检查
 * @param data {Object}
 * {
 *   "appId": "",
 *   "id": 0 分群/标签主键ID
 * }
 * @returns {Promise}
 */
export function bindingVerify(data) {
  return requset.post('/user-segmentation/binding-verify', {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 新增自定义分群 + 条件分群
 * @param data {Object}
 * {
 *   "accumulation": 是否累加 0 否 1是,
 *   "analyseId": 分析事件ID,
 *   "appId": "",
 *   "belongCluster": 是否属于分群 0 否 1是	,
 *   "clusterSql": 用户分群sql自定义查询语句,
 *   "createType": 创建类型 1表示条件分群 2 表示id分群 4自定义条件 5 首末次特征 6 指标值 7 ID标签 8 sql用户分群 9 sql用户标签,
 *   "creator": "",
 *   "defaultCluster": 是否是默认分群 0 否 1是(v2.0去除该处实现，在分析中实现该功能),
 *   "displayName": 分群显示名,
 *   "excludeSegmentationDay": 移除分群时间范围，如配置30，则表示：当用户30天没有触发条件时，则将用户从分群中移除(v2.0新增),
 *   "excludeSegmentationToggle": 移除分群开关，0 否，1 是(v2.0新增)	,
 *   "id": 0,
 *   "name": 分群名称	,
 *   "qp": "",
 *   "refreshType": 更新方式 0为手动更新 1为自动更新 2不更新,
 *   "remark": 备注	,
 *   "sql": sql查询语句,
 *   "tagSql": 用户标签sql自定义查询语句,
 *   "type": 0表示分群 1表示标签,
 *   "valueType": 值类型 0代表字符串 1表示整型 2表示浮点 3表示日期时间
 * }
 * @returns {Promise}
 */
export function asyncAddGroup(data) {
  return requset.post(`${reqPath}/add`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 新增ID分群
 * @param data {Object}
 * @returns {Promise}
 */
export function asyncAddIdGroup(data) {
  /* return requset.post(`${reqPath}/id/add`, {
    ...data,
    appId,
  })*/
  return requset.post(`${reqPath}/id/add`, data)
}

/**
 * @description 删除分群
 * @param data {Object}
 * {
 *   "appId": "",
 *   "id": 0
 * }
 * @returns {Promise}
 */
export function asyncDeleteGroup(data) {
  return requset.post(`${reqPath}/delete`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 根据ID查询分群信息
 * @param data {Object}
 * {
 *   "appId": "",
 *   "id": 0
 * }
 * @returns {Promise}
 */
export function asyncGetByIdGroupInfo(id) {
  return requset.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/cluster/${id}`
  )
}

/**
 * @description 编辑分群(不包括结果和ID分群)
 * @param data {Object}
 * @param data {Object}
 * {
 *   "accumulation": 是否累加 0 否 1是,
 *   "analyseId": 分析事件ID,
 *   "appId": "",
 *   "belongCluster": 是否属于分群 0 否 1是	,
 *   "clusterSql": 用户分群sql自定义查询语句,
 *   "createType": 创建类型 1表示条件分群 2 表示id分群 4自定义条件 5 首末次特征 6 指标值 7 ID标签 8 sql用户分群 9 sql用户标签,
 *   "creator": "",
 *   "defaultCluster": 是否是默认分群 0 否 1是(v2.0去除该处实现，在分析中实现该功能),
 *   "displayName": 分群显示名,
 *   "excludeSegmentationDay": 移除分群时间范围，如配置30，则表示：当用户30天没有触发条件时，则将用户从分群中移除(v2.0新增),
 *   "excludeSegmentationToggle": 移除分群开关，0 否，1 是(v2.0新增)	,
 *   "id": 0,
 *   "name": 分群名称	,
 *   "qp": "",
 *   "refreshType": 更新方式 0为手动更新 1为自动更新 2不更新,
 *   "remark": 备注	,
 *   "sql": sql查询语句,
 *   "tagSql": 用户标签sql自定义查询语句,
 *   "type": 0表示分群 1表示标签,
 *   "valueType": 值类型 0代表字符串 1表示整型 2表示浮点 3表示日期时间
 * }
 * @returns {Promise}
 */
export function asyncEditGroup(data) {
  return requset.post(`${reqPath}/edit`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 编辑ID分群
 * @param data {Object}
 * @returns {Promise}
 */
export function asyncEditIdGroup(data) {
  return requset.post(`${reqPath}/id/edit`, data)
}

/**
 * @description 导出ID分群上传文件
 * @param clusterName {string} 分群名
 * @returns {Promise}
 */
export function asyncExportIdGroupFile(clusterName) {
  return requset.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/cluster/${clusterName}/file`
  )
}

/**
 * @description 查询分群列表
 * @param data {Object}
 * {
 *   "appId": "",
 *   "createType": 创建类型 1表示条件分群 2 表示id分群 3表示结果分群 4自定义条件 5 首末次特征 6 指标值 7 ID标签 8 sql用户分群 9 sql用户标签,
 *   "fuzzySearchKey": 模糊查询关键字: 分群名、显示名、备注	,
 *   "page": 当前页数	,
 *   "refreshType": 更新方式 0为手动更新 1为自动更新 2不更新,
 *   "size": 每页大小，查询全部时请传递小于0的值,
 *   "sortFieldList": [排序字段名],
 *   "sortTypeList": [排序类型，要和排序字段名一一对应，正序：asc , 逆序：desc],
 *   "viewOnlyMyCreate": true 仅看我创建的
 * }
 * @returns {Promise}
 */
export function asyncGetGroupList(data) {
  return requset.post(`${reqPath}/list`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}

/**
 * @description 刷新分群数据
 * @param data {Object}
 * @returns {Promise}
 */
export function asyncRefreshGroupData(id, appId) {
  return requset.get(
    `${reqPath}/application/${appId || sessionStorage.getItem('appId')}/cluster/${id}/refresh`
  )
}

/**
 * @description ID分群关联属性列表
 * @param data {Object}
 * @returns {Promise}
 */
export function asyncGetIdGroupRelatedAttrList(id) {
  return requset.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/property`
  )
}

/**
 * @description 分群用户列表查询 (详情的表格)
 * @param id {string, number} 分群ID
 * @returns {Promise}
 */
export function asyncGetGroupUserList(id) {
  return requset.get(
    `${reqPath}/application/${sessionStorage.getItem('appId')}/cluster/${id}/user-list`
  )
}

/**
 * @description 分群人数分布查询 (详情的图表)
 * @param data {Object}
 * {
 *   "appId": "",
 *   "endDate": "结束时间",
 *   "id": 分群、标签ID,
 *   "startDate": "起始时间"
 * }
 * @returns {Promise}
 */
export function asyncGetGroupDistributionOfPeople(data) {
  return requset.post(`${reqPath}/trend`, {
    ...data,
    appId: sessionStorage.getItem('appId'),
  })
}
