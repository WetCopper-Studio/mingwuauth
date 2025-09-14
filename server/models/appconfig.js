import mongoose from 'mongoose';

const appconfigSchema = new mongoose.Schema({
  MoIP: {
    type: String,
    required: true
  },
  MoPo: {
    type: String,
    required: true
  },
  MoUs: {
    type: String,
    required: true
  },
  MoPs: {
    type: String,
    required: true
  },
  Adname: {
    type: String,
    required: true,
    unique: true
  },
  Adpsd: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// MongoDB IP：MongoDB数据库的IP地址
// MongoDB 端口：MongoDB数据库的端口号
// MongoDB 用户名：MongoDB数据库的用户名
// MongoDB 密码：MongoDB数据库的密码
// WebUI 用户名：Web管理界面的用户名
// WebUI 密码：Web管理界面的密码

export const AppConfig = mongoose.model('AppConfig', appconfigSchema);

export default AppConfig;