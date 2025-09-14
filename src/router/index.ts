import { createRouter, createWebHistory } from 'vue-router';

// 导入页面组件
import Home from '../views/Home.vue';
import AdminLogin from '../views/AdminLogin.vue';
import Overview from '../views/admin/Overview.vue';
import AppManagement from '../views/admin/AppManagement.vue';
import CardManagement from '../views/admin/CardManagement.vue';
import DomainAuthManagement from '../views/admin/DomainAuthManagement.vue';
import UnauthorizedDomain from '../views/admin/UnauthorizedDomain.vue';
import Layout from '../components/layout/Layout.vue';
import DBConfig from '../views/admin/DBConfig.vue';

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Layout,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'overview',
        name: 'Overview',
        component: Overview
      },
      {
        path: 'app-management',
        name: 'AppManagement',
        component: AppManagement
      },
      {
        path: 'card-management',
        name: 'CardManagement',
        component: CardManagement
      },
      {
        path: 'domain-auth-management',
        name: 'DomainAuthManagement',
        component: DomainAuthManagement
      },
      {
        path: 'unauthorized-domain',
        name: 'UnauthorizedDomain',
        component: UnauthorizedDomain
      },
      {
        path: 'db-config',
        name: 'DBConfig',
        component: DBConfig,
        meta: { title: '数据库配置' }
      }
    ]
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to: any, _from: any, next: any) => {
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    // 这里应该检查用户是否已登录
    // 实际应用中，应该使用 localStorage 或 cookie 存储登录状态
    const isLoggedIn = localStorage.getItem('adminToken') !== null;
    
    if (isLoggedIn) {
      next();
    } else {
      // 未登录，跳转到登录页面
      next('/admin/login');
    }
  } else {
    // 不再检查首次设置，直接继续路由
    next();
  }
});

export default router;