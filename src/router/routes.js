import Layout from '@/layouts/index.vue'

// 固定路由（默认路由）
const constantRoutes = [
  {
    path: '/login',
    name: 'login',
    hidden: true,
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录',
    },
  },
  {
    path: '/abtest',
    name: 'abtest',
    hidden: true,
    component: () => import('@/views/abtest/index.vue'),
    meta: {
      title: 'AB试验事件组件',
    },
  },
  {
    path: '/app-access',
    name: 'AppAccess',
    hidden: true,
    component: Layout,
    meta: {
      title: '应用接入',
    },
    children: [
      {
        path: '/app-access',
        name: 'AppAccessIndex',
        hidden: true,
        meta: {
          title: '应用接入',
        },
        component: () => import('@/views/app-access/index.vue'),
      },
    ],
  },
  {
    path: '/no-permission',
    name: 'NoPermission',
    hidden: true,
    component: Layout,
    meta: {
      title: '无访问权限',
    },
    children: [
      {
        path: '/no-permission',
        name: 'NoPermissionIndex',
        hidden: true,
        meta: {
          title: '无访问权限',
        },
        component: () => import('@/views/no-permission/index.vue'),
      },
    ],
  },
  /*  {
    path: '/my-apps',
    name: 'MyApps',
    hidden: true,
    component: Layout,
    meta: {
      title: '我的应用',
    },
    children: [
      {
        path: '/my-apps',
        name: 'MyAppsIndex',
        hidden: true,
        meta: {
          title: '我的应用',
        },
        component: () => import('@/views/my-apps/index.vue'),
      },
    ],
  },*/
  {
    path: '/reset-password',
    name: 'ResetPassword',
    hidden: true,
    meta: {
      title: '重置密码',
    },
    component: () => import('@/views/reset-password/index.vue'),
  },
  {
    path: '/set-password',
    name: 'SetPassword',
    hidden: true,
    meta: {
      title: '修改密码',
    },
    component: () => import('@/views/set-password/index.vue'),
  },
  {
    path: '/user-center',
    name: 'UcerCenter',
    hidden: true,
    component: Layout,
    meta: {
      title: '个人中心',
    },
    children: [
      {
        path: '/user-center',
        name: 'UcerCenterIndex',
        hidden: true,
        meta: {
          title: '个人中心',
        },
        component: () => import('@/views/user-center/index.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    hidden: true,
    component: Layout,
    meta: {
      title: '找不到页面',
    },
    children: [
      {
        path: '/:pathMatch(.*)*',
        hidden: true,
        meta: {
          title: '找不到页面',
        },
        component: () => import('@/views/not-found.vue'),
      },
    ],
  },
]
export { constantRoutes }
