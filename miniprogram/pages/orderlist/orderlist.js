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
    var env = require('../../envList.js').dev
    db.collection(app.globalData.collection_order + '_' + env).where(db.command.or([{
      _openid: this.data.openId
    }, {
      ownerid: this.data.openId
    }])).get({
      success: function (res) {
        console.log("res = ", res.data)
        that.setData({
          orders: res.data
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