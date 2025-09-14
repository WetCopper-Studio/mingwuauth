<template>
  <div class="unauthorized-domain-container">
    <div class="page-header">
      <h2>未授权域名管理</h2>
      <p>管理系统中上报的未授权域名信息</p>
    </div>
    
    <!-- 操作按钮区 -->
    <div class="action-buttons">
      <el-button type="warning" @click="handleExportDomains">
        <el-icon><Download /></el-icon>
        <span>导出未授权域名</span>
      </el-button>
      <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
        <el-icon><Delete /></el-icon>
        <span>批量删除</span>
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
        placeholder="搜索域名" 
        :prefix-icon="Search"
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <div class="filter-group">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="date-filter"
          @change="handleDateRangeChange"
        />
      </div>
    </div>
    
    <!-- 未授权域名列表 -->
    <el-card shadow="hover" class="domain-table-card">
      <el-table 
        :data="domainData" 
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="domain" label="未授权域名" width="250" show-overflow-tooltip />
        <el-table-column prop="time" label="上报时间" width="180" formatter="formatDate" />
        <el-table-column prop="ip" label="上报IP" width="150" show-overflow-tooltip />
        <el-table-column prop="userAgent" label="用户代理" width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" @click="handleDeleteDomain(row.domain)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" v-if="!loading && domainData.length > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalDomains"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
      
      <!-- 空状态 -->
      <el-empty 
        description="暂无未授权域名数据"
        v-if="!loading && domainData.length === 0"
        class="empty-state"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Download, Delete, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import authService from '@/services/authService';

// 未授权域名数据
const domainData = ref([]);
const totalDomains = ref(0);
const loading = ref(false);
const searchKeyword = ref('');
const dateRange = ref([]);

// 分页数据
const currentPage = ref(1);
const pageSize = ref(10);

// 选中的行
const selectedRows = ref([]);

// 格式化日期
const formatDate = (row, column, cellValue) => {
  if (!cellValue) return '';
  const date = new Date(cellValue);
  return date.toLocaleString('zh-CN');
};

// 获取未授权域名列表
const fetchDomains = async () => {
  try {
    loading.value = true;
    
    // 构建请求参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    };
    
    // 添加日期范围参数（如果有）
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    
    // 调用API获取未授权域名列表
    const response = await authService.getUnauthList(params);
    
    if (response.success) {
      domainData.value = response.data || [];
      totalDomains.value = response.total || 0;
    } else {
      ElMessage.warning(response.message || '获取未授权域名列表失败');
      domainData.value = [];
      totalDomains.value = 0;
    }
  } catch (error) {
    console.error('获取未授权域名列表失败:', error);
    ElMessage.error('获取未授权域名列表失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理导出未授权域名
const handleExportDomains = async () => {
  try {
    if (domainData.value.length === 0) {
      ElMessage.warning('暂无未授权域名数据可导出');
      return;
    }
    
    // 构建导出内容
    let exportContent = '域名,上报时间,上报IP,用户代理\n';
    domainData.value.forEach(domain => {
      // 用户代理可能包含逗号，需要用引号包裹
      const quotedUserAgent = `"${domain.userAgent}"`;
      exportContent += `${domain.domain},${formatDate(null, null, domain.time)},${domain.ip},${quotedUserAgent}\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([exportContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `未授权域名导出_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success(`成功导出 ${domainData.value.length} 条未授权域名记录`);
  } catch (error) {
    console.error('导出未授权域名失败:', error);
    ElMessage.error('导出未授权域名失败，请稍后再试');
  }
};

// 处理删除单个域名
const handleDeleteDomain = async (domain) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除未授权域名 ${domain} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    if (confirmResult === 'confirm') {
      loading.value = true;
      
      // 实际应用中，这里应该调用API删除域名
      // 为了演示，我们模拟删除操作
      await new Promise(resolve => setTimeout(resolve, 500));
      
      ElMessage.success('未授权域名删除成功');
      // 重新获取未授权域名列表
      await fetchDomains();
      // 清空选中状态
      selectedRows.value = [];
    }
  } catch (error) {
    if (error === 'cancel') return;
    console.error('删除未授权域名失败:', error);
    ElMessage.error('删除未授权域名失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理批量删除
const handleBatchDelete = async () => {
  try {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先选择要删除的未授权域名');
      return;
    }
    
    const domainsText = selectedRows.value.map(row => row.domain).join(', ');
    const confirmResult = await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个未授权域名吗？\n${domainsText}`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    );
    
    if (confirmResult === 'confirm') {
      loading.value = true;
      
      // 实际应用中，这里应该调用API批量删除域名
      // 为了演示，我们模拟批量删除操作
      await new Promise(resolve => setTimeout(resolve, 800));
      
      ElMessage.success(`成功删除 ${selectedRows.value.length} 个未授权域名`);
      // 重新获取未授权域名列表
      await fetchDomains();
      // 清空选中状态
      selectedRows.value = [];
    }
  } catch (error) {
    if (error === 'cancel') return;
    console.error('批量删除未授权域名失败:', error);
    ElMessage.error('批量删除未授权域名失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 处理选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  fetchDomains();
};

// 处理日期范围变化
const handleDateRangeChange = () => {
  currentPage.value = 1;
  fetchDomains();
};

// 处理刷新
const handleRefresh = () => {
  searchKeyword.value = '';
  dateRange.value = [];
  currentPage.value = 1;
  fetchDomains();
};

// 分页事件处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchDomains();
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
  fetchDomains();
};

// 组件挂载时获取未授权域名列表
onMounted(() => {
  fetchDomains();
});
</script>

<style scoped>
.unauthorized-domain-container {
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

.date-filter {
  width: 300px;
}

.domain-table-card {
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
  .unauthorized-domain-container {
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
  
  .search-input,
  .date-filter {
    width: 100%;
  }
  
  .domain-table-card {
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
  
  /* 表格列宽调整 */
  .el-table-column {
    min-width: 80px;
  }
  
  .el-table-column[prop="domain"] {
    min-width: 180px;
  }
  
  .el-table-column[prop="userAgent"] {
    min-width: 200px;
  }
}

/* 确保表格在所有设备上都可以水平滚动 */
.domain-table-wrapper {
  overflow-x: auto;
}

/* 表格列设置 */
@media (max-width: 768px) {
  .el-table-column[prop="time"] {
    min-width: 140px;
  }
}

/* 操作按钮在小屏幕上调整 */
@media (max-width: 480px) {
  .el-table__fixed-right {
    display: none;
  }
  
  /* 确保选择框在小屏幕上正确显示 */
  .el-table-column--selection {
    min-width: 40px;
  }
}
</style>