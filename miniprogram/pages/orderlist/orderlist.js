// pages/orderlist.js
const app = getApp()
let that = null // 页面this指针变量
let db = wx.cloud.database()

Page({
  data: {
    openId: '',
    userName: '登录',
    orders: [],
    isAdmin: false
  },

  onLoad(options) {
    that = this
    this.data.openId = wx.getStorageSync('open_id')
    this.getUserRole()
  },

  async getUserRole() {
    try {
      var env = require('../../envList.js').dev
      const db = wx.cloud.database()
      const { data } = await db.collection(app.globalData.collection_user + '_' + env)
        .where({
          _openid: this.data.openId
        })
        .get()

      if (data.length > 0) {
        this.setData({
          isAdmin: data[0].role === 'admin'
        })
        this.getOrderList()
      }
    } catch (err) {
      console.error(err)
    }
  },

  getOrderList() {
    wx.showLoading({
      title: '加载中...'
    })

    var env = require('../../envList.js').dev
    let query = {}
    
    if (!this.data.isAdmin) {
      query = db.command.or([
        { _openid: this.data.openId },
        { ownerid: this.data.openId }
      ])
    }

    db.collection(app.globalData.collection_order + '_' + env)
      .where(query)
      .get({
        success: function (res) {
          res.data.forEach(order => {
            order.createTime = formatTime(order.time) // 格式化时间
          })
          that.setData({
            orders: res.data
          })
          wx.hideLoading()
        },
        fail: function(err) {
          console.error(err)
          wx.hideLoading()
        }
      })
  },

  viewOrderDetail(event) {
    const orderId = event.currentTarget.dataset.orderid
    wx.navigateTo({
      url: '/pages/orderdetail/orderdetail?orderId=' + orderId
    })
  }
})

function formatTime(time) {
  if (!time) {
    return ''
  }

  const date = new Date(time)
  if (isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  return `${year}-${month}-${day} ${hour}:${minute < 10 ? '0' + minute : minute}`
}