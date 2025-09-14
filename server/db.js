import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppConfig } from './models/appconfig.js';
import { Apps } from './models/apps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 全局数据库连接
let dbConnection = null;

// 数据库连接函数
export const connectDB = async (config) => {
  try {
    // 如果已经连接，直接返回
    if (dbConnection && dbConnection.readyState === 1) {
      console.log('已连接到MongoDB');
      return dbConnection;
    }

    // 连接到MongoDB数据库
    const mongoURI = `mongodb://${config.MoUs}:${config.MoPs}@${config.MoIP}:${config.MoPo}/mingwuauth?authSource=admin`;
    
    // 设置连接选项
    const options = {
      connectTimeoutMS: 15000, // 增加连接超时到15秒
      socketTimeoutMS: 60000,  // 增加socket超时到1分钟
      serverSelectionTimeoutMS: 15000, // 增加服务器选择超时到15秒
      autoIndex: false, // 生产环境建议关闭自动索引
      family: 4, // 使用IPv4，避免IPv6解析问题
      heartbeatFrequencyMS: 10000
    };
    
    // 连接数据库
    dbConnection = await mongoose.connect(mongoURI, options);
    console.log('已成功连接到MongoDB数据库mingwuauth');
    
    // 保存配置到config.json文件
    const configPath = path.join(__dirname, '../config.json');
    const configData = {
      MoIP: config.MoIP,
      MoPo: config.MoPo,
      MoUs: config.MoUs,
      MoPs: config.MoPs,
      Adname: config.Adname,
      Adpsd: config.Adpsd
    };
    
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log('配置已保存到config.json文件');
    
    // 初始化AppConfig集合（如果不存在）
    try {
      // 检查是否已有配置，没有则创建
      let configRecord = await AppConfig.findOne();
      if (!configRecord) {
        configRecord = new AppConfig(configData);
        await configRecord.save();
        console.log('已创建初始配置数据');
      } else {
        // 更新现有配置
        await AppConfig.findOneAndUpdate({}, configData, { new: true });
        console.log('配置已更新到数据库');
      }
      
      // 确保apps集合已创建（用于存储应用数据）
      try {
        // 尝试访问Apps模型以确保它已被正确注册
        await Apps.findOne().lean();
        console.log('Apps集合已存在');
      } catch (appsError) {
        console.log('Apps集合初始化中...');
        // 如果发生错误，可能是集合不存在，但模型已在其他地方定义
        // 这里不需要重新定义模型，只需要确保集合存在
        const collection = mongoose.connection.collection('apps');
        await collection.createIndexes();
        console.log('Apps集合索引已创建');
      }
      
      console.log('数据初始化完成');
    } catch (dbInitError) {
      console.error('数据库初始化失败:', dbInitError.message);
    }
    
    return dbConnection;
  } catch (error) {
    console.error('MongoDB 连接失败:', error.message);
    console.log('应用将继续使用本地配置运行，不影响基本功能');
    return null;
  }
};

// 获取数据库连接
export const getDbConnection = () => {
  return dbConnection;
};

export default connectDB;