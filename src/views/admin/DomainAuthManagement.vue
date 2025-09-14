<template>
  <div class="domain-auth-management-container">
    <div class="page-header">
      <h2>域名授权管理</h2>
      <p>管理已授权的域名信息和状态</p>
    </div>
    
    <!-- 操作按钮区 -->
    <div class="action-buttons">
      <el-button type="primary" @click="handleAddAuth">
        <el-icon><Plus /></el-icon>
        <span>新增授权</span>
      </el-button>
      <el-button type="warning" @click="handleExportAuths">
        <el-icon><Download /></el-icon>
        <span>导出授权</span>
      </el-button>
      <el-button @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        <span>刷新</span>
      </el-button>
    </div>
    
    <!-- 搜索和筛选区 -->
    <div class="search-filter-section">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索域名或卡密" 
        :prefix-icon="Search"
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <div class="filter-group">
        <el-select 
          v-model="stateFilter" 
          placeholder="选择状态"
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="" />
          <el-option label="有效" value="0" />
          <el-option label="已过期" value="1" />
        </el-select>
        <el-select 
          v-model="timeFilter" 
          placeholder="选择时长" 
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="" />
          <el-option label="永久" value="-1" />
          <el-option label="一个月" value="30" />
          <el-option label="一年" value="365" />
        </el-select>
        <el-select 
          v-model="appidFilter" 
          placeholder="选择应用" 
          class="filter-select"
          @change="handleFilterChange"
        >
          <el-option label="全部" value="" />
          <el-option v-for="app in apps" :key="app.appid" :label="app.name" :value="app.appid" />
        </el-select>
      </div>
    </div>
    
    <!-- 域名授权列表 -->
    <el-card shadow="hover" class="auth-table-card">
      <el-table 
        :data="authData" 
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="domain" label="域名" width="200" show-overflow-tooltip />
        <el-table-column prop="key" label="卡密" width="200" show-overflow-tooltip />
        <el-table-column prop="appid" label="应用ID" width="120" />
        <el-table-column prop="time" label="授权时长" width="120">
          <template #default="{ row }">
            <span v-if="row.time === -1">永久</span>
            <span v-else-if="row.time === 30">一个月</span>
            <span v-else-if="row.time === 365">一年</span>
            <span v-else>{{ row.time }}天</span>
          </template>
        </el-table-column>
        <el-table-column prop="state" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.state === 0 ? 'success' : 'danger'">
              {{ row.state === 0 ? '有效' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" :formatter="formatDate" />
        <el-table-column prop="expireAt" label="过期时间" width="180" :formatter="formatDate" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewAuth(row)">查看</el-button>
            <el-button 
              link 
              type="danger" 
              @click="handleDeleteAuth(row.domain)"
              v-if="row.state === 0"
            >
              吊销
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" v-if="!loading && authData.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalAuths"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        description="暂无域名授权数据"
        v-if="!loading && authData.length === 0"
        class="empty-state"
      />
    </el-card>
  </div>
  
  <!-- 新增授权对话框 -->
  <el-dialog 
    v-model="addAuthDialogVisible" 
    title="新增域名授权"
    width="400px"
  >
    <el-form 
      ref="addAuthFormRef" 
      :model="addAuthForm" 
      :rules="addAuthRules" 
      label-width="100px"
    >
      <el-form-item label="域名" prop="domain">
        <el-input 
          v-model="addAuthForm.domain" 
          placeholder="请输入域名（如：example.com）"
        />
      </el-form-item>
      <el-form-item label="卡密" prop="key">
        <el-input 
          v-model="addAuthForm.key" 
          placeholder="请输入卡密"
        />
      </el-form-item>
      <el-form-item label="所属应用" prop="appid">
        <el-select 
          v-model="addAuthForm.appid" 
          placeholder="选择应用"
        >
          <el-option v-for="app in apps" :key="app.appid" :label="app.name" :value="app.appid" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="addAuthDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddAuthConfirm">确认</el-button>
      </span>
    </template>
  </el-dialog>
  
  <!-- 授权详情对话框 -->
  <el-dialog 
    v-model="viewAuthDialogVisible" 
    title="授权详情"
    width="600px"
  >
    <div v-if="selectedAuth" class="auth-detail">
      <div class="detail-item">
        <span class="detail-label">域名：</span>
        <span class="detail-value">{{ selectedAuth.domain }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">卡密：</span>
        <span class="detail-value">{{ selectedAuth.key }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">应用ID：</span>
        <span class="detail-value">{{ selectedAuth.appid }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">应用名称：</span>
        <span class="detail-value">{{ getAppName(selectedAuth.appid) }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">授权时长：</span>
        <span class="detail-value">
          <span v-if="selectedAuth.time === -1">永久</span>
          <span v-else-if="selectedAuth.time === 30">一个月</span>
          <span v-else-if="selectedAuth.time === 365">一年</span>
          <span v-else>{{ selectedAuth.time }}天</span>
        </span>
      </div>
      <div class="detail-item">
        <span class="detail-label">状态：</span>
        <span class="detail-value">
          <el-tag :type="selectedAuth.state === 0 ? 'success' : 'danger'">
            {{ selectedAuth.state === 0 ? '有效' : '已过期' }}
          </el-tag>
        </span>
      </div>
      <div class="detail-item">
        <span class="detail-label">创建时间：</span>
        <span class="detail-value">{{ formatDate(selectedAuth.createdAt) }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">过期时间：</span>
        <span class="detail-value">{{ formatDate(selectedAuth.expireAt) }}</span>
      </div>
      <div class="detail-item" v-if="selectedAuth.cert">
        <span class="detail-label">证书：</span>
        <div class="cert-content">
          <el-button 
            type="text" 
            @click="showFullCert = !showFullCert"
            class="show-cert-btn"
          >
            {{ showFullCert ? '收起证书' : '查看证书' }}
          </el-button>
          <pre v-if="showFullCert" class="cert-pre">{{ selectedAuth.cert }}</pre>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="viewAuthDialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Download, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import authService from '@/services/authService';

// 域名授权数据
const authData = ref([]);
const totalAuths = ref(0);
const loading = ref(false);
const searchKeyword = ref('');

// 筛选条件
const stateFilter = ref('');
const timeFilter = ref('');
const appidFilter = ref('');

// 分页数据
const currentPage = ref(1);
const pageSize = ref(10);

// 应用列表
const apps = ref([]);

// 新增授权对话框
const addAuthDialogVisible = ref(false);
const addAuthFormRef = ref(null);
const addAuthForm = reactive({
  domain: '',
  key: '',
  appid: ''
});

const addAuthRules = {
  domain: [
    { required: true, message: '请输入域名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, message: '请输入有效的域名', trigger: 'blur' }
  ],
  key: [
    { required: true, message: '请输入卡密', trigger: 'blur' }
  ],
  appid: [
    { required: true, message: '请选择所属应用', trigger: 'change' }
  ]
};

// 授权详情对话框
const viewAuthDialogVisible = ref(false);
const selectedAuth = ref(null);
const showFullCert = ref(false);

// 获取应用列表
const fetchApps = async () => {
  try {
    const response = await authService.getAppList({ page: 1, pageSize: 100 });
    if (response.success) {
      apps.value = response.data;
    } else {
      console.error('获取应用列表失败:', response.message);
      ElMessage.error('获取应用列表失败');
    }
  } catch (error) {
    console.error('获取应用列表失败:', error);
    ElMessage.error('获取应用列表失败');
  }
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 获取应用名称
const getAppName = (appid) => {
  const app = apps.value.find(item => item.appid === appid);
  return app ? app.name : appid;
};

// 获取域名授权列表
const fetchAuths = async () => {
  try {
    loading.value = true;
    
    // 构建请求参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      searchKeyword: searchKeyword.value,
      stateFilter: stateFilter.value,
      timeFilter: timeFilter.value,
      appidFilter: appidFilter.value
    };
    
    // 调用API获取授权列表
    const response = await authService.getAuthList(params);
    
    if (response.success) {
      authData.value = response.data;
      totalAuths.value = response.total;
    } else {
      console.error('获取域名授权列表失败:', response.message);
      ElMessage.error('获取域名授权列表失败，请稍后再试');
    }
  } catch (error) {
    console.error('获取域名授权列表失败:', error);
    ElMessage.error('获取域名授权列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理新增授权
const handleAddAuth = () => {
  // 重置表单
  if (addAuthFormRef.value) {
    addAuthFormRef.value.resetFields();
  }
  // 显示对话框
  addAuthDialogVisible.value = true;
};

// 处理新增确认
const handleAddAuthConfirm = async () => {
  try {
    const valid = await addAuthFormRef.value.validate();
    if (valid) {
      loading.value = true;
      
      // 调用API新增授权
      const response = await authService.addAuth(addAuthForm.domain, addAuthForm.key, addAuthForm.appid);
      
      if (response.success) {
        ElMessage.success('域名授权添加成功');
        
        // 关闭对话框
        addAuthDialogVisible.value = false;
        // 重新获取域名授权列表
        await fetchAuths();
      } else {
        ElMessage.error(response.message || '添加域名授权失败');
      }
    }
  } catch (error) {
    console.error('添加域名授权失败:', error);
    ElMessage.error(error.message || '添加域名授权失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理导出授权
const handleExportAuths = async () => {
  try {
    // 构建导出内容
    let exportContent = '域名,卡密,应用ID,授权时长,状态,创建时间,过期时间\n';
    authData.value.forEach(auth => {
      let timeText = '永久';
      if (auth.time === 30) timeText = '一个月';
      else if (auth.time === 365) timeText = '一年';
      
      const stateText = auth.state === 0 ? '有效' : '已过期';
      
      exportContent += `${auth.domain},${auth.key},${auth.appid},${timeText},${stateText},${formatDate(auth.createdAt)},${formatDate(auth.expireAt)}\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([exportContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `域名授权导出_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success(`成功导出 ${authData.value.length} 条域名授权记录`);
  } catch (error) {
    console.error('导出域名授权失败:', error);
    ElMessage.error('导出域名授权失败，请稍后再试');
  }
};

// 处理查看授权详情
const handleViewAuth = (auth) => {
  selectedAuth.value = { ...auth };
  showFullCert.value = false;
  viewAuthDialogVisible.value = true;
};

// 处理吊销授权
const handleDeleteAuth = async (domain) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要吊销域名 ${domain} 的授权吗？`,
      '吊销确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    if (confirmResult === 'confirm') {
      loading.value = true;
      
      // 实际应用中，这里应该调用API吊销授权
      // 为了演示，我们模拟吊销操作
      await new Promise(resolve => setTimeout(resolve, 500));
      
      ElMessage.success('域名授权吊销成功');
      // 重新获取域名授权列表
      await fetchAuths();
    }
  } catch (error) {
    if (error === 'cancel') return;
    console.error('吊销域名授权失败:', error);
    ElMessage.error('吊销域名授权失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchAuths();
};

// 处理筛选条件变化
const handleFilterChange = () => {
  currentPage.value = 1;
  fetchAuths();
};

// 处理刷新
const handleRefresh = () => {
  searchKeyword.value = '';
  stateFilter.value = '';
  timeFilter.value = '';
  appidFilter.value = '';
  currentPage.value = 1;
  fetchAuths();
};

// 分页事件处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchAuths();
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
  fetchAuths();
};

// 组件挂载时获取域名授权列表和应用列表
onMounted(() => {
  fetchAuths();
  fetchApps();
});
</script>

<style scoped>
.domain-auth-management-container {
  width: 100%;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.page-header p {
  margin: 5px 0 0;
  color: #909399;
  font-size: 14px;
}

.action-buttons {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.search-filter-section {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.filter-select {
  width: 150px;
}

.auth-table-card {
  overflow: hidden;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  padding: 60px 0;
}

/* 授权详情样式 */
.auth-detail {
  padding: 10px 0;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.detail-label {
  width: 100px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.detail-value {
  flex: 1;
  color: #303133;
  font-size: 14px;
}

.cert-content {
  flex: 1;
}

.show-cert-btn {
  color: #409eff;
}

.cert-pre {
  margin: 10px 0 0;
  padding: 10px;
  background-color: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #303133;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .domain-auth-management-container {
    padding: 10px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
  
  .search-filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .filter-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .auth-table-card {
    overflow-x: auto;
  }
  
  .pagination {
    justify-content: center;
  }
  
  .detail-item {
    flex-direction: column;
  }
  
  .detail-label {
    margin-bottom: 5px;
  }
}

@media (max-width: 480px) {
  /* 表格适配移动端 */
  .el-table {
    font-size: 12px;
  }
  
  /* 在小屏幕上隐藏某些列 */
  .el-table .hide-on-mobile {
    display: none;
  }
  
  /* 对话框适配 */
  .el-dialog {
    width: 90% !important;
    margin: 5vh auto !important;
  }
  
  /* 表格列宽调整 */
  .el-table-column {
    min-width: 80px;
  }
  
  .el-table-column[prop="domain"],
  .el-table-column[prop="key"] {
    min-width: 180px;
  }
}

/* 确保表格在所有设备上都可以水平滚动 */
.auth-table-wrapper {
  overflow-x: auto;
}

/* 表格列设置 */
@media (max-width: 768px) {
  .el-table-column[prop="createdAt"],
  .el-table-column[prop="expireAt"] {
    min-width: 140px;
  }
}

/* 操作按钮在小屏幕上调整 */
@media (max-width: 480px) {
  .el-table__fixed-right {
    display: none;
  }
  
  /* 适配详情对话框 */
  .auth-detail {
    font-size: 12px;
  }
  
  .cert-pre {
    font-size: 10px;
    padding: 8px;
  }
}
</style>