<template>
  <div class="overview-container">
    <div class="page-header">
      <h2>总览</h2>
      <p>查看系统的整体情况和统计信息</p>
    </div>
    
    <!-- 数据概览卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Ticket /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-number">{{ stats.totalKeys || 0 }}</p>
            <p class="stat-label">总卡密数</p>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-number">{{ stats.activeAuthorizations || 0 }}</p>
            <p class="stat-label">活跃授权数</p>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Grid /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-number">{{ stats.totalApps || 0 }}</p>
            <p class="stat-label">应用总数</p>
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-number">{{ stats.unauthorizedDomains || 0 }}</p>
            <p class="stat-label">未授权域名</p>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域 -->
    <div class="charts-section">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>授权趋势</span>
          </div>
        </template>
        <div class="chart-container">
          <el-empty 
            description="暂无数据"
            v-if="!hasChartData"
          />
          <div v-else>
            <!-- 这里将放置图表组件，实际应用中需要引入ECharts等图表库 -->
            <div class="mock-chart"></div>
          </div>
        </div>
      </el-card>
      
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>授权类型分布</span>
          </div>
        </template>
        <div class="chart-container">
          <el-empty 
            description="暂无数据"
            v-if="!hasChartData"
          />
          <div v-else>
            <!-- 这里将放置图表组件，实际应用中需要引入ECharts等图表库 -->
            <div class="mock-chart pie-chart"></div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 最近活动 -->
    <div class="recent-activities">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>最近活动</span>
          </div>
        </template>
        <el-table 
          :data="recentActivities" 
          style="width: 100%"
          v-if="recentActivities.length > 0"
        >
          <el-table-column prop="type" label="活动类型" width="120" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="time" label="时间" width="180" />
        </el-table>
        <el-empty 
          description="暂无活动记录"
          v-else
        />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Ticket, Lock, Grid, Warning } from '@element-plus/icons-vue';
import authService from '@/services/authService';

// 统计数据
const stats = ref({
  totalKeys: 0,
  activeAuthorizations: 0,
  totalApps: 0,
  unauthorizedDomains: 0
});

// 图表数据状态
const hasChartData = ref(false);

// 最近活动记录
const recentActivities = ref([]);

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await authService.getStats();
    if (response.success) {
      stats.value = response.data;
      // 设置图表数据状态为有数据（如果有统计数据）
      hasChartData.value = stats.value.totalKeys > 0 || stats.value.activeAuthorizations > 0;
    }
  } catch (error) {
    console.error('获取统计数据失败:', error);
    // 出错时使用默认数据作为备份
    stats.value = {
      totalKeys: 0,
      activeAuthorizations: 0,
      totalApps: 0,
      unauthorizedDomains: 0
    };
  }
};

// 获取最近活动记录
const fetchRecentActivities = async () => {
  try {
    const response = await authService.getRecentActivities();
    if (response.success) {
      recentActivities.value = response.data;
    }
  } catch (error) {
    console.error('获取最近活动记录失败:', error);
    // 出错时使用空数组作为备份
    recentActivities.value = [];
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchStats();
  fetchRecentActivities();
});
</script>

<style scoped>
.overview-container {
  width: 100%;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: #1890ff;
}

.stat-info .stat-number {
  margin: 0;
  font-size: 30px;
  font-weight: bold;
  color: #303133;
}

.stat-info .stat-label {
  margin: 5px 0 0;
  color: #909399;
  font-size: 14px;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mock-chart {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 4px;
}

.pie-chart {
  background: linear-gradient(135deg, #fef08a 0%, #fde68a 100%);
}

.recent-activities {
  margin-bottom: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-container {
    padding: 10px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .stat-info .stat-number {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .stat-content {
    padding: 15px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
    margin-right: 15px;
  }
  
  .chart-container {
    height: 200px;
  }
}
</style>