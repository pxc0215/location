const app = getApp()
let db = wx.cloud.database()
Page({
  data: {
    userId: '',
    userInfo: {
      nickName: '',
      avatarUrl: '',
      company: '',
      phoneNumber: ''
    }
  },

  onLoad(options) {
    const userId = options.userId;
    this.setData({ userId });
    this.getUserDetail(userId);
  },

  getUserDetail(openId) {
    const env = require('../../envList.js').dev;
    const collectionName = app.globalData.collection_user + '_' + env;

    wx.showLoading({
      title: '加载中...'
    });

    wx.cloud.callFunction({
      name: 'userDetail',
      data: {
        openId,
        collectionName
      },
      success: res => {
        wx.hideLoading();
        if (res.result.success) {
          this.setData({
            userInfo: res.result.data
          });
        } else {
          wx.showToast({
            title: '用户信息未找到',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        console.error('获取用户信息失败：', err);
      }
    });
  },

  makePhoneCall() {
    const phoneNumber = this.data.userInfo.phoneNumber;
    if (phoneNumber) {
      wx.makePhoneCall({
        phoneNumber: phoneNumber,
        fail: (err) => {
          wx.showToast({
            title: '拨号失败',
            icon: 'none'
          });
        }
      });
    } else {
      wx.showToast({
        title: '无有效手机号',
        icon: 'none'
      });
    }
  }
});
