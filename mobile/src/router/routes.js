import Layout from '@mobile/layouts/index.vue'

// 固定路由（默认路由）
export const mobileConstantRoutes = [
  {
    path: '/login',
    name: 'login',
    hidden: true,
    component: () => import('@mobile/views/login/index.vue'),
    meta: {
      title: '登录',
    },
  },
  /* {
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
        component: () => import('@mobile/views/not-found.vue'),
      },
    ],
  },
  */
  {
    path: '/no-permission',
    name: 'NoPermission',
    hidden: true,
    component: () => import('@/views/no-permission/index.vue'),
    meta: {
      title: '无访问权限',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    hidden: true,
    component: () => import('@mobile/views/not-found.vue'),
    meta: {
      title: '找不到页面',
    },
  },
]
