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
    })
    var env = require('../../envList.js').dev
    const collectionName = app.globalData.collection_order + '_' + env

    db.collection(collectionName).doc(orderId).get({
      success: res => {
        let order = res.data
        // 格式化时间
        order.time = this.formatTime(order.time)
        // 如果有头像，设置头像
        order.ownerAvatarUrl = order.ownerAvatarUrl || '/asset/default_avatar.png';
        // 格式化流转记录时间
        if (order.flowRecords && order.flowRecords.length > 0) {
          order.flowRecords = order.flowRecords.map(item => {
            item.time = this.formatTime(item.timestamp)
            return item
          })
        }
        // 归档时间
        if (order.archived) {
          order.archiveTime = this.formatTime(order.archiveTimestamp)
        }
        this.setData({
          order
        })
        wx.hideLoading()
      },
      fail: err => {
        wx.hideLoading()
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        console.error(err)
      }
    })
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
    const current = this.data.order.files.map(file => file.id)
    wx.previewImage({
      current: current[0],
      urls: current
    })
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
    const { selectedStatus, statusRemark } = this.data;
    // TODO: 处理状态修改的逻辑
    console.log('Status:', selectedStatus);
    console.log('Remark:', statusRemark);
    this.closeStatusModal();
  },

  // 修改菜单项点击事件
  onMenuItemClick(e) {
    const action = e.currentTarget.dataset.action;
    if (action === 'process') {
      this.handleProcess();
    }
    // ... 其他菜单项处理
  }
})