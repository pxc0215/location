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
        console.log("res = ", res.data)
        // 处理每个订单的时间显示
        const orders = res.data.map(order => {
          // 如果存在 createTime 字段且为时间戳
          if (order.createTime) {
            const date = new Date(order.createTime);
            order.createTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          } else {
            // 如果没有 createTime，使用数据库自带的 _createTime
            const date = new Date(order._createTime || Date.now());
            order.createTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }
          return order;
        });

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
  }
})