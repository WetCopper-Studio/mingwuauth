<template>
  <div class="app-management-container">
    <div class="page-header">
      <h2>应用管理</h2>
      <p>管理系统中的应用信息</p>
    </div>
    
    <!-- 操作按钮区 -->
    <div class="action-buttons">
      <el-button type="primary" @click="handleAddApp">
        <el-icon><Plus /></el-icon>
        <span>添加应用</span>
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
        placeholder="搜索应用ID或名称" 
        :prefix-icon="Search"
        class="search-input"
        @keyup.enter="handleSearch"
      />
    </div>
    
    <!-- 应用列表 -->
    <el-card shadow="hover" class="apps-table-card">
      <el-table 
        :data="appsData" 
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="appid" label="应用ID" width="180" />
        <el-table-column prop="name" label="应用名称" />
        <el-table-column prop="Download" label="下载链接" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" :formatter="formatDate" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" :formatter="formatDate" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditApp(row)">
              编辑
            </el-button>
            <el-button link type="danger" @click="handleDeleteApp(row.appid)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" v-if="!loading && appsData.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalApps"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        description="暂无应用数据"
        v-if="!loading && appsData.length === 0"
        class="empty-state"
      />
    </el-card>
  </div>
  
  <!-- 添加/编辑应用对话框 -->
  <el-dialog 
    v-model="dialogVisible" 
    :title="dialogTitle"
    width="500px"
    @close="handleDialogClose"
  >
    <el-form 
      ref="appFormRef" 
      :model="appForm" 
      :rules="appRules" 
      label-width="100px"
      class="app-form"
    >
      <el-form-item label="应用ID" prop="appid" :disabled="isEditMode">
        <el-input 
          v-model="appForm.appid" 
          placeholder="请输入应用ID"
          :disabled="isEditMode"
        />
      </el-form-item>
      <el-form-item label="应用名称" prop="name">
        <el-input 
          v-model="appForm.name" 
          placeholder="请输入应用名称"
        />
      </el-form-item>
      <el-form-item label="下载链接" prop="Download">
        <el-input 
          v-model="appForm.Download" 
          placeholder="请输入下载链接"
        />
      </el-form-item>
      <el-form-item label="版本号" prop="version">
        <el-input 
          v-model="appForm.version" 
          placeholder="请输入版本号"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitApp">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { appService } from '../../services/appService.js';

// 应用数据
const appsData = ref([]);
const totalApps = ref(0);
const loading = ref(false);
const searchKeyword = ref('');

// 分页数据
const currentPage = ref(1);
const pageSize = ref(10);

// 对话框数据
const dialogVisible = ref(false);
const appFormRef = ref(null);
const isEditMode = ref(false);
const dialogTitle = computed(() => isEditMode.value ? '编辑应用' : '添加应用');
const appForm = reactive({
  appid: '',
  name: '',
  Download: '',
  version: ''
});

const appRules = {
  appid: [
    { required: true, message: '请输入应用ID', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '应用ID只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入应用名称', trigger: 'blur' }
  ],
  Download: [
    { required: true, message: '请输入下载链接', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' }
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
    loading.value = true;
    
    // 调用API获取应用列表
    const response = await appService.getAppList(
      currentPage.value,
      pageSize.value,
      searchKeyword.value
    );
    
    if (response.success) {
      appsData.value = response.data;
      totalApps.value = response.total;
    } else {
      throw new Error(response.message || '获取应用列表失败');
    }
  } catch (error) {
    console.error('获取应用列表失败:', error);
    ElMessage.error(error.message || '获取应用列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理添加应用
const handleAddApp = () => {
  isEditMode.value = false;
  // 重置表单
  if (appFormRef.value) {
    appFormRef.value.resetFields();
  }
  // 清空表单数据
  appForm.appid = '';
  appForm.name = '';
  appForm.Download = '';
  appForm.version = '';
  // 显示对话框
  dialogVisible.value = true;
};

// 处理编辑应用
const handleEditApp = (row) => {
  isEditMode.value = true;
  // 填充表单数据
  appForm.appid = row.appid;
  appForm.name = row.name;
  appForm.Download = row.Download;
  appForm.version = row.version;
  // 显示对话框
  dialogVisible.value = true;
};

// 处理删除应用
const handleDeleteApp = async (appid) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除应用ID为${appid}的应用吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    if (confirmResult === 'confirm') {
      loading.value = true;
      
      // 调用API删除应用
      const response = await appService.deleteApp(appid);
      
      if (response.success) {
        ElMessage.success(response.message || '应用删除成功');
        // 重新获取应用列表
        await fetchApps();
      } else {
        throw new Error(response.message || '删除应用失败');
      }
    }
  } catch (error) {
    if (error === 'cancel') return;
    console.error('删除应用失败:', error);
    ElMessage.error(error.message || '删除应用失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理提交应用表单
const handleSubmitApp = async () => {
  try {
    const valid = await appFormRef.value.validate();
    if (valid) {
      loading.value = true;
      
      // 根据模式调用不同的API
      let response;
      if (isEditMode.value) {
        // 更新应用
        response = await appService.updateApp(appForm);
      } else {
        // 添加应用
        response = await appService.addApp(appForm);
      }
      
      if (response.success) {
        const action = isEditMode.value ? '更新' : '添加';
        ElMessage.success(response.message || `应用${action}成功`);
        
        // 关闭对话框
        dialogVisible.value = false;
        // 重新获取应用列表
        await fetchApps();
      } else {
        throw new Error(response.message || '操作失败');
      }
    }
  } catch (error) {
    console.error('提交应用表单失败:', error);
    ElMessage.error(error.message || '操作失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchApps();
};

// 处理刷新
const handleRefresh = () => {
  searchKeyword.value = '';
  currentPage.value = 1;
  fetchApps();
};

// 处理对话框关闭
const handleDialogClose = () => {
  if (appFormRef.value) {
    appFormRef.value.resetFields();
  }
};

// 分页事件处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchApps();
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
  fetchApps();
};

// 组件挂载时获取应用列表
onMounted(() => {
  fetchApps();
});
</script>

<style scoped>
.app-management-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
}

.action-buttons {
  margin-bottom: 20px;
}

.search-filter-section {
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.apps-table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.empty-state {
  margin: 40px 0;
}

.app-form {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>