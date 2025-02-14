import requset from '../index'

export function getUserDetailList(data) {
  return requset({
    url: '/user/action/search',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

export function exportUserDetail(data) {
  return requset({
    url: '/user/action/download',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
    responseType: 'blob',
  })
}

export function saveResultCluster(data) {
  return requset({
    url: '/user/cluster/saveResultCluster',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}

export function editResultCluster(data) {
  return requset({
    url: '/user/cluster/editResultCluster',
    method: 'post',
    data: {
      ...data,
      appId: data?.appId || sessionStorage.getItem('appId'),
    },
  })
}
