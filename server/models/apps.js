import mongoose from 'mongoose';

const appsSchema = new mongoose.Schema({
  appid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  Download: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// 应用ID：应用的唯一标识符
// 应用名称：应用的名称
// 下载直链：应用的下载链接
// 应用版本：应用的版本号

export const Apps = mongoose.model('Apps', appsSchema);

export default Apps;