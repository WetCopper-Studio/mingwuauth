import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import apiRoutes from './routes/api.js';

const app = express();
// 从环境变量读取端口配置，默认3000
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - 提供前端页面
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 提供dist目录下的静态文件
app.use(express.static(path.join(__dirname, '../dist')));

// API路由
app.use('/api', apiRoutes);

// 处理前端路由 - 确保在所有API路由之后定义
app.get(/^((?!api).)*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 导入Node.js模块
import fs from 'fs';

// 初始化配置
const initializeApp = async () => {
  try {
    // 无论是否有配置，都先启动服务器
    app.listen(PORT, () => {
      console.log(`服务器已启动，端口：${PORT}`);
      console.log(`请访问 http://localhost:${PORT}/ 进行操作`);
    });
    
    // 尝试加载本地config.json配置文件
    try {
      const configPath = path.join(__dirname, '../config.json');
      
      if (fs.existsSync(configPath)) {
        console.log('检测到本地配置文件，尝试连接数据库...');
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        await connectDB(configData);
      } else {
        console.log('未检测到配置文件(config.json)，请创建配置文件后重启应用');
      }
    } catch (fileError) {
      console.log('未找到本地配置文件，需要进行初始化配置');
    }
    
    // 数据库检查逻辑已在db.js中异步处理，这里不再重复检查
  } catch (error) {
    console.error('启动服务器失败:', error);
  }
};

// 启动应用
initializeApp();