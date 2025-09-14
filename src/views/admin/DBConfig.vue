<template>
  <div class="db-config-container">
    <div class="page-header">
      <h2>数据库配置</h2>
      <p>配置MongoDB数据库连接信息</p>
    </div>
    
    <el-card shadow="hover" class="config-card">
      <el-form 
        ref="configFormRef"
        :model="configForm"
        :rules="configRules"
        label-width="150px"
        class="config-form"
      >
        <el-form-item label="MongoDB IP" prop="MoIP">
          <el-input 
            v-model="configForm.MoIP"
            placeholder="请输入MongoDB数据库的IP地址"
          />
        </el-form-item>
        
        <el-form-item label="MongoDB 端口" prop="MoPo">
          <el-input 
            v-model="configForm.MoPo"
            placeholder="请输入MongoDB数据库的端口号"
            type="number"
          />
        </el-form-item>
        
        <el-form-item label="MongoDB 用户名" prop="MoUs">
          <el-input 
            v-model="configForm.MoUs"
            placeholder="请输入MongoDB数据库的用户名"
          />
        </el-form-item>
        
        <el-form-item label="MongoDB 密码" prop="MoPs">
          <el-input 
            v-model="configForm.MoPs"
            placeholder="请输入MongoDB数据库的密码"
            type="password"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="WebUI 用户名" prop="Adname">
          <el-input 
            v-model="configForm.Adname"
            placeholder="请输入Web管理界面的用户名"
          />
        </el-form-item>
        
        <el-form-item label="WebUI 密码" prop="Adpsd">
          <el-input 
            v-model="configForm.Adpsd"
            placeholder="请输入Web管理界面的密码"
            type="password"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSaveConfig" :loading="saving">
            保存配置
          </el-button>
          <el-button @click="handleCancel">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const router = useRouter();
const configFormRef = ref(null);
const saving = ref(false);
const configForm = reactive({
  MoIP: '',
  MoPo: '',
  MoUs: '',
  MoPs: '',
  Adname: '',
  Adpsd: ''
});

const configRules = {
  MoIP: [
    { required: true, message: '请输入MongoDB IP', trigger: 'blur' }
  ],
  MoPo: [
    { required: true, message: '请输入MongoDB 端口', trigger: 'blur' },
    { type: 'number', message: '端口必须是数字', trigger: 'blur' }
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
  ]
};

// 加载当前配置
const loadConfig = async () => {
  try {
    const response = await axios.get('/api/config');
    // 确保正确处理响应数据结构
    const data = response.data || response;
    if (data.success && data.config) {
      Object.assign(configForm, data.config);
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    ElMessage.error('加载配置失败，请稍后再试');
  }
};

// 保存配置
const handleSaveConfig = async () => {
  try {
    const valid = await configFormRef.value.validate();
    if (valid) {
      saving.value = true;
      
      const response = await axios.post('/api/save-config', configForm);
      
      // 确保正确处理响应数据结构
      const data = response.data || response;
      if (data.success) {
        ElMessage.success('配置保存成功，请重新启动应用使配置生效');
        // 保存成功后重定向到登录页
        setTimeout(() => {
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
        }, 2000);
      } else {
        ElMessage.error(data.message || '配置保存失败');
      }
    }
  } catch (error) {
    console.error('保存配置失败:', error);
    ElMessage.error('保存配置失败，请稍后再试');
  } finally {
    saving.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  router.push('/admin/overview');
};

// 页面加载时获取配置
onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.db-config-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 10px 0 0;
  color: #606266;
  font-size: 14px;
}

.config-card {
  max-width: 800px;
}

.config-form {
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .db-config-container {
    padding: 10px;
  }
  
  .config-form {
    label-width: 100px;
  }
  
  .el-form-item {
    margin-bottom: 15px;
  }
}
</style>