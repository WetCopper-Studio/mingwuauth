<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <el-avatar icon="el-icon-lock" class="logo" />
        <span class="title">冥雾授权系统</span>
      </div>
      <div class="header-right">
        <el-dropdown v-if="isAdmin">
          <span class="el-dropdown-link">
            <el-icon><User /></el-icon>
            <span>{{ username || '管理员' }}</span>
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <div class="layout-main">
      <!-- 侧边栏导航 -->
      <el-aside class="aside" width="200px" v-if="isAdmin">
        <el-menu 
          default-active="/admin/overview" 
          class="menu" 
          @select="handleMenuSelect"
          :router="true"
        >
          <el-menu-item index="/admin/overview">
          <el-icon><HomeFilled /></el-icon>
          <span>总览</span>
        </el-menu-item>
        <el-menu-item index="/admin/app-management">
          <el-icon><Grid /></el-icon>
          <span>应用管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/card-management">
          <el-icon><Ticket /></el-icon>
          <span>卡密管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/domain-auth-management">
          <el-icon><Lock /></el-icon>
          <span>授权管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/unauthorized-domain">
          <el-icon><Warning /></el-icon>
          <span>盗版查看</span>
        </el-menu-item>
        <el-menu-item index="/admin/db-config">
          <el-icon><Setting /></el-icon>
          <span>数据库配置</span>
        </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main class="main">
        <router-view></router-view>
      </el-main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  User, 
  ArrowDown, 
  HomeFilled, 
  Grid, 
  Ticket, 
  Lock, 
  Warning,
  Setting 
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const isAdmin = ref(false);
const username = ref('');

// 检查用户是否为管理员
const checkAdminStatus = () => {
  // 使用与路由守卫和登录组件相同的adminToken键
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) { // 只需要检查adminToken是否存在，而不是检查它是否等于'true'
    isAdmin.value = true;
    username.value = localStorage.getItem('username') || '管理员';
  } else {
    // 非管理员状态下，重定向到首页（授权查询页面）
    router.push('/');
  }
};

// 处理菜单选择
const handleMenuSelect = (index) => {
  // 不需要在这里再次调用router.push，因为el-menu的:router="true"属性已经会处理路由跳转
};

// 处理退出登录
const handleLogout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('username');
  isAdmin.value = false;
  username.value = '';
  router.push('/');
  ElMessage.success('退出登录成功');
};

// 组件挂载时检查管理员状态
onMounted(() => {
  checkAdminStatus();
});
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  margin-right: 10px;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.header-right {
  display: flex;
  align-items: center;
}

.layout-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.aside {
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  overflow-y: auto;
}

.menu {
  height: 100%;
  border-right: none;
}

.main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f5f5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .aside {
    display: none;
  }
  
  .main {
    padding: 10px;
  }
}
</style>