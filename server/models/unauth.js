import mongoose from 'mongoose';

const unauthSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    index: true
  },
  time: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// 授权域名：上报的未授权域名
// 上报时间：域名被上报的时间

export const Unauth = mongoose.model('Unauth', unauthSchema);

export default Unauth;