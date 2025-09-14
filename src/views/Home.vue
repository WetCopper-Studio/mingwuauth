<template>
  <div class="home-container">
    <div class="home-header">
      <h1>冥雾授权查询</h1>
      <p>输入域名查询是否已授权</p>
    </div>
    
    <div class="query-form-wrapper">
      <el-form 
        ref="queryFormRef" 
        :model="queryForm" 
        :rules="queryRules" 
        class="query-form"
      >
        <el-form-item prop="domain">
          <el-input 
            v-model="queryForm.domain" 
            placeholder="请输入域名（如：example.com）"
            :prefix-icon="Search"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            class="query-button"
            :loading="loading"
            @click="handleQuery"
          >
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 查询结果 -->
    <div v-if="showResult" class="result-card">
      <div v-if="result.success" class="success-result">
        <div class="result-header">
          <el-icon><Check /></el-icon>
          <span>查询成功</span>
        </div>
        <div class="result-content">
          <p><strong>域名：</strong>{{ result.domain }}</p>
          <p><strong>授权状态：</strong>
            <span v-if="result.state === 1" class="status-active">已授权</span>
            <span v-else class="status-inactive">未授权</span>
          </p>
          <p><strong>授权时长：</strong>
            <span v-if="result.time === -1">永久</span>
            <span v-else-if="result.time === 30">{{ result.time }}天（一个月）</span>
            <span v-else-if="result.time === 365">{{ result.time }}天（一年）</span>
            <span v-else>{{ result.time }}天</span>
          </p>
        </div>
      </div>
      
      <div v-else class="error-result">
        <div class="result-header">
          <el-icon><Warning /></el-icon>
          <span>查询失败</span>
        </div>
        <div class="result-content">
          <p>{{ result.message || '未找到该域名的授权信息' }}</p>
        </div>
      </div>
    </div>
    

  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Check, Warning } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import authService from '../services/authService';

const router = useRouter();
const queryFormRef = ref(null);
const loading = ref(false);
const showResult = ref(false);
const result = ref({});

const queryForm = reactive({
  domain: ''
});

const queryRules = {
  domain: [
    { required: true, message: '请输入域名', trigger: 'blur' },
    { 
      pattern: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, 
      message: '请输入有效的域名', 
      trigger: 'blur'
    }
  ]
};

// 处理域名查询
const handleQuery = async () => {
  try {
    const valid = await queryFormRef.value.validate();
    if (valid) {
      loading.value = true;
      
      // 调用API查询授权信息
      const response = await authService.inquireAuthorization(queryForm.domain);
      
      showResult.value = true;
      result.value = response;
      
      if (!response.success) {
        ElMessage.warning(response.message || '未找到该域名的授权信息');
      }
    }
  } catch (error) {
    console.error('查询授权失败:', error);
    showResult.value = true;
    result.value = {
      success: false,
      message: error.message || '查询失败，请稍后再试'
    };
    ElMessage.error('查询失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};


</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f5;
}

.home-header {
  text-align: center;
  margin-bottom: 40px;
}

.home-header h1 {
  margin: 0;
  font-size: 36px;
  color: #1890ff;
  font-weight: 600;
}

.home-header p {
  margin: 10px 0 0;
  color: #606266;
  font-size: 16px;
}

.query-form-wrapper {
  background-color: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  margin-bottom: 30px;
}

.query-form {
  width: 100%;
}

.query-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

.result-card {
  width: 100%;
  max-width: 500px;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.result-header .el-icon {
  margin-right: 10px;
  font-size: 20px;
}

.success-result .result-header .el-icon {
  color: #67c23a;
}

.error-result .result-header .el-icon {
  color: #f56c6c;
}

.result-content p {
  margin: 10px 0;
  color: #606266;
}

.status-active {
  color: #67c23a;
  font-weight: 500;
}

.status-inactive {
  color: #f56c6c;
  font-weight: 500;
}

.admin-entry {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    padding: 15px;
  }
  
  .home-header {
    margin-bottom: 30px;
  }
  
  .home-header h1 {
    font-size: 28px;
  }
  
  .home-header p {
    font-size: 14px;
  }
  
  .query-form-wrapper {
    padding: 20px;
    max-width: 100%;
  }
  
  .result-card {
    max-width: 100%;
  }
  
  .admin-entry {
    position: static;
    margin-top: 20px;
  }
}/* 小屏幕设备适配 */
@media (max-width: 480px) {
  .home-container {
    padding: 10px;
  }
  
  .home-header {
    margin-bottom: 20px;
  }
  
  .home-header h1 {
    font-size: 24px;
  }
  
  .home-header p {
    font-size: 13px;
  }
  
  .query-form-wrapper {
    padding: 15px;
    margin-bottom: 20px;
  }
  
  .query-button {
    font-size: 14px;
    height: 36px;
  }
  
  .result-card {
    padding: 15px;
  }
  
  .result-content p {
    font-size: 14px;
    margin: 8px 0;
  }
}
</style>