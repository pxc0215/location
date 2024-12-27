const app = getApp()
const db = wx.cloud.database()
let that

Page({
  data: {
    order: {},
    orderId: '',
    showMenu: false,
    showStatusModal: false,
    selectedStatus: '',
    statusRemark: ''
  },

  onLoad: function (options) {
    that = this
    const orderId = options.orderId
    this.setData({
      orderId
    })
    this.getOrderDetail(orderId)
  },

  getOrderDetail: function (orderId) {
    wx.showLoading({
      title: '加载中...'
    });
    const env = require('../../envList.js').dev;
    const orderCollection = app.globalData.collection_order + '_' + env;
    const handle = 'get';

    wx.cloud.callFunction({
      name: 'orderDetail',
      data: {
        orderId,
        handle,
        orderCollection
      },
      success: res => {
        if (res.result.success) {
          let order = res.result.data;
          // 创建一个包含所有时间轴事件的数组
          let timelineEvents = [];
          // 添加创建记录
          timelineEvents.push({
            type: 'create',
            time: order.time,
            userName: order.ownername,
            userPhone: order.ownerPhone,
            userId: order.ownerid,
            desc: order.desc
          });

          // 添加流转记录
          if (order.flowRecords && order.flowRecords.length > 0) {
            timelineEvents = timelineEvents.concat(order.flowRecords.map(record => ({
              type: 'flow',
              time: record.time,
              userName: record.userName,
              userId: record.userId,
              status: record.status,
              remark: record.remark
            })));
          }

          // 按时间戳倒序排序（最新的在前）
          timelineEvents.sort((a, b) => b.time - a.time);

          // 格式化时间
          timelineEvents = timelineEvents.map(event => ({
            ...event,
            time: this.formatTime(event.time)
          }));

          // 更新订单数据
          order.timelineEvents = timelineEvents;
          this.setData({
            order
          });
        } else {
          wx.showToast({
            title: '加载失败'
          })
        }
        wx.hideLoading();
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        console.error('获取订单详情失败：', err);
      }
    });
  },

  // 复制地址
  copyAddress: function () {
    wx.setClipboardData({
      data: this.data.order.address,
      success: function () {
        wx.showToast({
          title: '地址已复制',
          icon: 'success',
          duration: 2000
        })
      }
    })
  },

  // 时间格式化函数
  formatTime: function (timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = ('0' + (date.getMonth() + 1)).slice(-2)
    const day = ('0' + date.getDate()).slice(-2)
    const hour = ('0' + date.getHours()).slice(-2)
    const minute = ('0' + date.getMinutes()).slice(-2)
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 预览图片
  previewImage: function (e) {
    const current = e.currentTarget.dataset.src;
    const urls = this.data.order.files.map(file => file.id);
    wx.previewImage({
      current: current, // The current image to display
      urls: urls // The list of images to preview
    });
  },

  // 切换菜单显示状态
  toggleMenu() {
    this.setData({
      showMenu: !this.data.showMenu
    });
  },

  // 隐藏菜单
  hideMenu() {
    this.setData({
      showMenu: false
    });
  },

  // 点击处理按钮
  handleProcess() {
    this.setData({
      showStatusModal: true,
      showMenu: false,
      selectedStatus: 'processing', // 默认选中"处理中"
      statusRemark: ''
    });
  },

  // 选择状态
  selectStatus(e) {
    this.setData({
      selectedStatus: e.currentTarget.dataset.status
    });
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({
      statusRemark: e.detail.value
    });
  },

  // 关闭状态修改弹窗
  closeStatusModal() {
    this.setData({
      showStatusModal: false
    });
  },

  // 确认修改状态
  confirmStatusChange() {
    const {
      selectedStatus,
      statusRemark,
      orderId
    } = this.data;

    // 显示加载提示
    wx.showLoading({
      title: '提交中...',
    });

    const env = require('../../envList.js').dev;
    const orderCollection = app.globalData.collection_order + '_' + env;


    // 准备更新的数据
    const handle = 'update';
    const now = new Date();
    const flowRecord = {
      status: selectedStatus,
      remark: statusRemark || '', // 备注为空时存储空字符串
      time: now.getTime(),
      userName: wx.getStorageSync('user_name') || '未知用户',
      userId: wx.getStorageSync('open_id')
    };

    // 更新数据库
    wx.cloud.callFunction({
      name: 'orderDetail',
      data: {
        orderId,
        handle,
        orderCollection,
        flowRecord
      },
      success: res => {
        wx.hideLoading();
        // 更新成功后刷新页面数据
        this.getOrderDetail(orderId);
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
        this.closeStatusModal();
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        });
        console.error('更新失败：', err);
      }
    });
  },

  // 修改菜单项点击事件
  onMenuItemClick(e) {
    const action = e.currentTarget.dataset.action;
    if (action === 'process') {
      this.handleProcess();
    }
    // ... 其他菜单项处理
  },

  // 处理拨打电话
  makePhoneCall(e) {
    const userId = e.currentTarget.dataset.userid;
    if (!userId) {
      wx.showToast({
        title: '无法获取用户信息',
        icon: 'none'
      });
      return;
    }

    // 获取用户手机号
    const env = require('../../envList.js').dev;
    const userCollection = app.globalData.collection_user + '_' + env;
    const db = wx.cloud.database();

    wx.showLoading({
      title: '获取手机号...'
    });

    db.collection(userCollection).where({
      _openid: userId
    }).get({
      success: res => {
        wx.hideLoading();
        if (res.data.length > 0 && res.data[0].phoneNumber) {
          // 有手机号，调起拨号面板
          wx.makePhoneCall({
            phoneNumber: res.data[0].phoneNumber,
            fail: (err) => {
              wx.showToast({
                title: '拨号失败',
                icon: 'none'
              });
            }
          });
        } else {
          // 没有手机号
          wx.showToast({
            title: '无法获取用户手机号',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        console.error('获取用户手机号失败：', err);
      }
    });
  },

  navigateToUserDetail(e) {
    const userId = e.currentTarget.dataset.userid;
    if (userId) {
      wx.navigateTo({
        url: `/pages/userDetail/userDetail?userId=${userId}`
      });
    } else {
      wx.showToast({
        title: '无法获取用户信息',
        icon: 'none'
      });
    }
  }
})