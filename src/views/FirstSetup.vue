<template>
  <div class="first-setup-container">
    <div class="setup-wrapper">
      <div class="setup-header">
        <el-avatar icon="el-icon-setting" class="logo" />
        <h1>首次启动设置</h1>
        <p>请配置数据库连接信息和管理员账号</p>
      </div>
      
      <el-card shadow="hover" class="setup-card">
        <el-form 
          ref="setupFormRef"
          :model="setupForm"
          :rules="setupRules"
          label-width="150px"
          class="setup-form"
        >
          <h3 class="section-title">数据库配置</h3>
          <el-form-item label="MongoDB IP" prop="MoIP">
            <el-input 
              v-model="setupForm.MoIP"
              placeholder="请输入MongoDB数据库的IP地址"
            />
          </el-form-item>
          
          <el-form-item label="MongoDB 端口" prop="MoPo">
            <el-input 
              v-model="setupForm.MoPo"
              placeholder="请输入MongoDB数据库的端口号"
              type="number"
            />
          </el-form-item>
          
          <el-form-item label="MongoDB 用户名" prop="MoUs">
            <el-input 
              v-model="setupForm.MoUs"
              placeholder="请输入MongoDB数据库的用户名"
            />
          </el-form-item>
          
          <el-form-item label="MongoDB 密码" prop="MoPs">
            <el-input 
              v-model="setupForm.MoPs"
              placeholder="请输入MongoDB数据库的密码"
              type="password"
              show-password
            />
          </el-form-item>
          
          <h3 class="section-title">管理员账号配置</h3>
          <el-form-item label="WebUI 用户名" prop="Adname">
            <el-input 
              v-model="setupForm.Adname"
              placeholder="请输入Web管理界面的用户名"
            />
          </el-form-item>
          
          <el-form-item label="WebUI 密码" prop="Adpsd">
            <el-input 
              v-model="setupForm.Adpsd"
              placeholder="请输入Web管理界面的密码"
              type="password"
              show-password
            />
            <div class="form-tip">密码长度不能少于6位</div>
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="setupForm.confirmPassword"
              placeholder="请再次输入密码"
              type="password"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="submitting" class="submit-button">
              完成设置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { apiClient } from '../services/authService.js';

const router = useRouter();
const setupFormRef = ref(null);
const submitting = ref(false);
const setupForm = reactive({
  MoIP: 'localhost',
  MoPo: '27017',
  MoUs: 'admin',
  MoPs: 'password',
  Adname: 'admin',
  Adpsd: 'admin123',
  confirmPassword: 'admin123'
});

const setupRules = {
  MoIP: [
    { required: true, message: '请输入MongoDB IP', trigger: 'blur' }
  ],
  MoPo: [
        { required: true, message: '请输入MongoDB 端口', trigger: 'blur' },
        { type: 'string', pattern: /^[0-9]+$/, message: '端口必须是数字', trigger: 'blur' }
      ],
  MoUs: [
    { required: true, message: '请输入MongoDB 用户名', trigger: 'blur' }
  ],
  MoPs: [
    { required: true, message: '请输入MongoDB 密码', trigger: 'blur' }
  ],
  Adname: [
    { required: true, message: '请输入WebUI 用户名', trigger: 'blur' }
  ],
  Adpsd: [
    { required: true, message: '请输入WebUI 密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== setupForm.Adpsd) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 提交设置
const handleSubmit = async () => {
  try {
    const valid = await setupFormRef.value.validate();
    if (valid) {
      submitting.value = true;
      
      // 移除确认密码字段
      const configData = {
        MoIP: setupForm.MoIP,
        MoPo: setupForm.MoPo,
        MoUs: setupForm.MoUs,
        MoPs: setupForm.MoPs,
        Adname: setupForm.Adname,
        Adpsd: setupForm.Adpsd
      };
      
      const response = await apiClient.post('/save-config', configData);
      
      if (response.data && response.data.success) {
        ElMessage.success('设置完成！系统即将重启...');
        
        // 等待2秒后重定向到登录页
        setTimeout(() => {
          router.push('/admin/login');
        }, 2000);
      } else {
        ElMessage.error(response.data?.message || '设置失败，请稍后再试');
      }
    }
  } catch (error) {
    console.error('设置失败:', error);
    ElMessage.error(error.response?.data?.message || error.message || '设置失败，请稍后再试');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.first-setup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.setup-wrapper {
  width: 100%;
  max-width: 700px;
}

.setup-header {
  text-align: center;
  margin-bottom: 30px;
}

.setup-header .logo {
  width: 80px;
  height: 80px;
  font-size: 40px;
  margin: 0 auto 20px;
}

.setup-header h1 {
  margin: 0;
  font-size: 32px;
  color: #1890ff;
  font-weight: 600;
}

.setup-header p {
  margin: 10px 0 0;
  color: #606266;
  font-size: 16px;
}

.setup-card {
  background-color: #fff;
  border-radius: 8px;
}

.setup-form {
  margin-top: 20px;
}

.section-title {
  margin: 20px 0 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.submit-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .first-setup-container {
    padding: 10px;
  }
  
  .setup-wrapper {
    max-width: 100%;
  }
  
  .setup-header h1 {
    font-size: 24px;
  }
  
  .setup-form {
    label-width: 120px;
  }
  
  .el-form-item {
    margin-bottom: 15px;
  }
  
  .section-title {
    font-size: 14px;
  }
}/* 小屏幕设备适配 */
@media (max-width: 480px) {
  .first-setup-container {
    padding: 8px;
  }
  
  .setup-header .logo {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }
  
  .setup-header h1 {
    font-size: 20px;
  }
  
  .setup-header p {
    font-size: 14px;
  }
  
  .setup-form {
    label-width: 100px;
  }
  
  .el-input {
    font-size: 14px;
  }
  
  .submit-button {
    font-size: 14px;
    height: 36px;
  }
}
</style>