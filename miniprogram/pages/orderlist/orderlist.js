// pages/orderlist.js
const app = getApp()
let that = null // 页面this指针变量
let db = wx.cloud.database()

Page({
  data: {
    openId: '',
    userName: '登录',
    orders: [],
    unfold: []
  },

  // 格式化日期的函数
  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    // 检查是否为有效日期
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    that = this
    this.data.openId = wx.getStorageSync('open_id')
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getOrderList()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  getOrderList() {
    wx.showLoading({
      title: '加载中...'
    })

    var env = require('../../envList.js').dev
    db.collection(app.globalData.collection_order + '_' + env).where(db.command.or([{
      _openid: this.data.openId
    }, {
      ownerid: this.data.openId
    }])).get({
      success: function (res) {
        console.log("原始数据: ", res.data)
        // 处理每个订单的时间显示和状态记录
        const orders = res.data.map(order => {
          console.log("处理订单时间，原始数据：", order)
          
          // 格式化创建时间
          order.createTime = that.formatDate(order.time);
          console.log("格式化后的创建时间：", order.createTime)

          // 处理流转记录
          if (order.flowRecords && Array.isArray(order.flowRecords)) {
            order.flowRecords = order.flowRecords.map(record => {
              console.log("流转记录时间戳：", record.timestamp)
              return {
                ...record,
                time: that.formatDate(record.timestamp)
              }
            })
          } else {
            order.flowRecords = []
          }

          // 处理归档记录
          if (order.archived) {
            order.archiveTime = that.formatDate(order.archiveTimestamp)
          }

          console.log("处理后的订单数据：", order)
          return order
        })

        that.setData({
          orders: orders
        })
        wx.hideLoading()
      },
      fail: function(err) {
        console.error('获取订单列表失败：', err)
        wx.hideLoading()
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        })
      }
    })
  },

  foldItem(event){
    var index = event.currentTarget.dataset.id;
    this.data.unfold[index] = !this.data.unfold[index]
    this.setData({
      unfold : this.data.unfold
    })
  },
})