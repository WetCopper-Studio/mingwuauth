<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <div class="login-header">
        <el-avatar icon="el-icon-lock" class="logo" />
        <h2>管理员登录</h2>
      </div>
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        class="login-form"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            :prefix-icon="UserFilled"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            placeholder="请输入密码"
            type="password"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { UserFilled, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const router = useRouter();
const loginFormRef = ref(null);
const loading = ref(false);
const loginForm = reactive({
  username: '',
  password: ''
});

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
};

// 登录验证
const handleLogin = async () => {
  try {
    console.log('开始登录验证，用户名:', loginForm.username);
    const valid = await loginFormRef.value.validate();
    if (valid) {
      loading.value = true;
      
      // 调用API进行登录验证
      console.log('表单验证通过，准备发送登录请求');
      const response = await axios.post('/api/login', {
        username: loginForm.username,
        password: loginForm.password
      });
      
      console.log('登录请求返回响应:', response);
      // 正确处理Axios响应数据结构
      const data = response.data;
      console.log('登录响应数据:', data);
      if (data.success) {
        // 登录成功，保存登录状态
        localStorage.setItem('adminToken', 'true');
        localStorage.setItem('username', loginForm.username);
        
        ElMessage.success('登录成功');
        
        // 重定向到总览页面
        router.push('/admin/overview');
      } else {
        // 登录失败
        console.log('登录失败，服务器返回错误:', data.message);
        ElMessage.error(data.message || '用户名或密码错误');
      }
    } else {
      console.log('表单验证失败');
    }
  } catch (error) {
    console.error('登录验证异常:', error);
    console.error('错误详情:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : '无响应'
    });
    // 处理不同类型的错误
    if (error.response && error.response.data && error.response.data.message) {
      ElMessage.error(error.response.data.message);
    } else {
      ElMessage.error('登录验证失败，请稍后再试');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form-wrapper {
  background-color: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 15px;
}

.login-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.login-form {
  width: 100%;
}

.login-button {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-form-wrapper {
    margin: 20px;
    padding: 20px;
    max-width: 100%;
  }
  
  .login-header h2 {
    font-size: 20px;
  }
  
  .logo {
    width: 50px;
    height: 50px;
  }
}/* 小屏幕设备适配 */
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  
  .login-form-wrapper {
    margin: 10px;
    padding: 15px;
  }
  
  .login-header {
    margin-bottom: 20px;
  }
  
  .logo {
    width: 40px;
    height: 40px;
    margin-bottom: 10px;
  }
  
  .login-header h2 {
    font-size: 18px;
  }
  
  .login-form {
    label-width: 70px;
  }
  
  .el-input {
    font-size: 14px;
  }
  
  .login-button {
    font-size: 14px;
    height: 36px;
  }
}
</style>