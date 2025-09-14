import { apiClient } from './authService.js';

// 应用管理服务
export const appService = {
  // 获取应用列表
  getAppList: async (page = 1, pageSize = 10, searchKeyword = '') => {
    try {
      const response = await apiClient.post('/apps/list', {
        page,
        pageSize,
        searchKeyword
      });
      return response;
    } catch (error) {
      console.error('获取应用列表失败:', error);
      throw error;
    }
  },

  // 添加应用
  addApp: async (appData) => {
    try {
      const response = await apiClient.post('/apps/add', appData);
      return response;
    } catch (error) {
      console.error('添加应用失败:', error);
      throw error;
    }
  },

  // 更新应用
  updateApp: async (appData) => {
    try {
      const response = await apiClient.post('/apps/update', appData);
      return response;
    } catch (error) {
      console.error('更新应用失败:', error);
      throw error;
    }
  },

  // 删除应用
  deleteApp: async (appid) => {
    try {
      const response = await apiClient.post('/apps/delete', { appid });
      return response;
    } catch (error) {
      console.error('删除应用失败:', error);
      throw error;
    }
  },

  // 获取单个应用信息
  getAppInfo: async (appid) => {
    try {
      const response = await apiClient.post('/appinfo', { appid });
      return response;
    } catch (error) {
      console.error('获取应用信息失败:', error);
      throw error;
    }
  }
};

export default appService;