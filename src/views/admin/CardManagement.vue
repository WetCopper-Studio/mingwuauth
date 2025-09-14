<template>
  <div class="card-management-container">
    <div class="page-header">
      <h2>卡密管理</h2>
      <p>管理系统中的授权卡密</p>
    </div>
    
    <!-- 操作按钮区 -->
    <div class="action-buttons">
      <el-button type="primary" @click="handleGenerateKeys">
        <el-icon><Ticket /></el-icon>
        <span>生成卡密</span>
      </el-button>
      <el-button type="warning" @click="handleExportKeys">
        <el-icon><Download /></el-icon>
        <span>导出卡密</span>
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
        placeholder="搜索卡密" 
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
          <el-option label="未使用" value="0" />
          <el-option label="已使用" value="1" />
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
    
    <!-- 卡密列表 -->
    <el-card shadow="hover" class="cards-table-card">
      <el-table 
        :data="keysData" 
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="key" label="卡密" width="300" show-overflow-tooltip />
        <el-table-column prop="appid" label="应用ID" width="150" />
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
            <el-tag :type="row.state === 0 ? 'success' : 'info'">
              {{ row.state === 0 ? '未使用' : '已使用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" :formatter="formatDate" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" :formatter="formatDate" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              type="danger" 
              @click="handleDeleteKey(row.key)"
              v-if="row.state === 0"
            >
              删除
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" v-if="!loading && keysData.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalKeys"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        description="暂无卡密数据"
        v-if="!loading && keysData.length === 0"
        class="empty-state"
      />
    </el-card>
  </div>
  
  <!-- 生成卡密对话框 -->
  <el-dialog 
    v-model="generateDialogVisible" 
    title="生成卡密"
    width="400px"
  >
    <el-form 
      ref="generateFormRef" 
      :model="generateForm" 
      :rules="generateRules" 
      label-width="100px"
    >
      <el-form-item label="数量" prop="count">
        <el-input 
          v-model.number="generateForm.count" 
          placeholder="请输入生成数量"
          type="number"
          :min="1"
          :max="100"
        />
      </el-form-item>
      <el-form-item label="授权时长" prop="time">
        <el-radio-group v-model="generateForm.time">
          <el-radio :label="-1">永久</el-radio>
          <el-radio :label="30">一个月</el-radio>
          <el-radio :label="365">一年</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="所属应用" prop="appid">
        <el-select 
          v-model="generateForm.appid" 
          placeholder="选择应用"
        >
          <el-option v-for="app in apps" :key="app.appid" :label="app.name" :value="app.appid" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGenerateConfirm">生成</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Ticket, Download, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import authService from '@/services/authService';

// 卡密数据
const keysData = ref([]);
const totalKeys = ref(0);
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

// 生成卡密对话框
const generateDialogVisible = ref(false);
const generateFormRef = ref(null);
const generateForm = reactive({
  count: 1,
  time: -1,
  appid: ''
});

const generateRules = {
  count: [
    { required: true, message: '请输入生成数量', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '生成数量应在1-100之间', trigger: 'blur' }
  ],
  time: [
    { required: true, message: '请选择授权时长', trigger: 'change' }
  ],
  appid: [
    { required: true, message: '请选择所属应用', trigger: 'change' }
  ]
};

// 格式化日期
const formatDate = (row, column, cellValue) => {
  if (!cellValue) return '';
  const date = new Date(cellValue);
  return date.toLocaleString('zh-CN');
};

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

// 获取卡密列表
const fetchKeys = async () => {
  try {
    loading.value = true;
    
    console.log('开始获取卡密列表，参数:', {
      page: currentPage.value,
      pageSize: pageSize.value,
      searchKeyword: searchKeyword.value,
      stateFilter: stateFilter.value,
      timeFilter: timeFilter.value,
      appidFilter: appidFilter.value
    });
    
    // 调用API获取卡密列表
    const response = await authService.getKeyList({
      page: currentPage.value,
      pageSize: pageSize.value,
      searchKeyword: searchKeyword.value,
      stateFilter: stateFilter.value,
      timeFilter: timeFilter.value,
      appidFilter: appidFilter.value
    });
    
    console.log('获取卡密列表响应:', response);
    
    if (response.success) {
      console.log('卡密数据:', response.data);
      keysData.value = response.data || [];
      totalKeys.value = response.total || 0;
      currentPage.value = response.currentPage || currentPage.value;
      pageSize.value = response.pageSize || pageSize.value;
    } else {
      console.log('获取卡密列表失败:', response.message);
      ElMessage.error(response.message || '获取卡密列表失败');
      keysData.value = [];
      totalKeys.value = 0;
    }
  } catch (error) {
    console.error('获取卡密列表异常:', error);
    ElMessage.error('获取卡密列表失败，请稍后再试');
    keysData.value = [];
    totalKeys.value = 0;
  } finally {
    loading.value = false;
  }
};

// 处理生成卡密
const handleGenerateKeys = () => {
  // 重置表单
  if (generateFormRef.value) {
    generateFormRef.value.resetFields();
  }
  // 设置默认值
  generateForm.count = 1;
  generateForm.time = -1;
  generateForm.appid = '';
  // 显示对话框
  generateDialogVisible.value = true;
};

// 处理生成确认
const handleGenerateConfirm = async () => {
  try {
    const valid = await generateFormRef.value.validate();
    if (valid) {
      loading.value = true;
      
      // 调用API生成卡密
      const response = await authService.generateKeys(generateForm);
      
      if (response.success) {
        ElMessage.success(response.message || `成功生成 ${generateForm.count} 个卡密`);
        
        // 关闭对话框
        generateDialogVisible.value = false;
        // 重新获取卡密列表
        await fetchKeys();
      } else {
        ElMessage.error(response.message || '生成卡密失败');
      }
    }
  } catch (error) {
    console.error('生成卡密失败:', error);
    ElMessage.error('生成卡密失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理导出卡密
const handleExportKeys = async () => {
  try {
    // 只导出未使用的卡密
    const unusedKeys = keysData.value.filter(key => key.state === 0);
    
    if (unusedKeys.length === 0) {
      ElMessage.warning('暂无未使用的卡密可导出');
      return;
    }
    
    // 构建导出内容
    let exportContent = '卡密,授权时长,所属应用\n';
    unusedKeys.forEach(key => {
      let timeText = '永久';
      if (key.time === 30) timeText = '一个月';
      else if (key.time === 365) timeText = '一年';
      
      const app = apps.value.find(a => a.appid === key.appid);
      const appName = app ? app.name : key.appid;
      
      exportContent += `${key.key},${timeText},${appName}\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([exportContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `卡密导出_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success(`成功导出 ${unusedKeys.length} 个卡密`);
  } catch (error) {
    console.error('导出卡密失败:', error);
    ElMessage.error('导出卡密失败，请稍后再试');
  }
};

// 处理删除卡密
const handleDeleteKey = async (key) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除卡密 ${key} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    if (confirmResult === 'confirm') {
      loading.value = true;
      
      // 调用API删除卡密
      const response = await authService.deleteKey({ key });
      
      if (response.success) {
        ElMessage.success(response.message || '卡密删除成功');
        // 重新获取卡密列表
        await fetchKeys();
      } else {
        ElMessage.error(response.message || '卡密删除失败');
      }
    }
  } catch (error) {
    if (error === 'cancel') return;
    console.error('删除卡密失败:', error);
    ElMessage.error('删除卡密失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchKeys();
};

// 处理筛选条件变化
const handleFilterChange = () => {
  currentPage.value = 1;
  fetchKeys();
};

// 处理刷新
const handleRefresh = () => {
  searchKeyword.value = '';
  stateFilter.value = '';
  timeFilter.value = '';
  appidFilter.value = '';
  currentPage.value = 1;
  fetchKeys();
};

// 分页事件处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchKeys();
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
  fetchKeys();
};

// 初始化时获取卡密列表和应用列表
onMounted(() => {
  fetchKeys();
  fetchApps();
});
</script>

<style scoped>
.card-management-container {
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

.cards-table-card {
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

/* 响应式设计 */
@media (max-width: 768px) {
  .card-management-container {
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
  
  .cards-table-card {
    overflow-x: auto;
  }
  
  .pagination {
    justify-content: center;
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
  
  .el-table-column[prop="key"] {
    min-width: 200px;
  }
}

/* 确保表格在所有设备上都可以水平滚动 */
.cards-table-wrapper {
  overflow-x: auto;
}

/* 表格列设置 */
@media (max-width: 768px) {
  .el-table-column[prop="createdAt"],
  .el-table-column[prop="updatedAt"] {
    min-width: 140px;
  }
}
</style>