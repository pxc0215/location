// pages/orderlist.js
const app = getApp()
let that = null // 页面this指针变量
let db = wx.cloud.database()

Page({
  data: {
    orders: []
  },

  onLoad(options) {
    that = this
    this.getOrderList()
  },

  getOrderList: function () {
    wx.showLoading({
      title: '加载中...'
    })

    const env = require('../../envList.js').dev
    const userCollection = app.globalData.collection_user + '_' + env
    const orderCollection = app.globalData.collection_order + '_' + env
    // 使用云函数获取订单列表(如果通过客户端直接访问数据，只能访问到用户本人创建的数据，除非修改云函数权限，但这样并不安全)
    wx.cloud.callFunction({
      name: 'getOrderList',
      data: {
        userCollection,
        orderCollection
      },
      success: res => {
        if (res.result.success) {
          res.result.data.forEach(order => {
            order.createTime = formatTime(order.time) // 格式化时间
            console.log(order.flowRecords)

            // Determine the status text based on flowRecords
            if (!order.flowRecords || order.flowRecords.length === 0) {
              order.statusText = '新创建'
            } else {
              const lastFlowRecord = order.flowRecords[order.flowRecords.length - 1]
              if (lastFlowRecord.status === 'processing') {
                order.statusText = '处理中'
              } else if (lastFlowRecord.status === 'completed') {
                order.statusText = '已完成'
              } else {
                order.statusText = '未知状态' // Fallback for unknown statuses
              }
            }
          })

          this.setData({
            orders: res.result.data
          })
        } else {
          wx.showToast({
            title: '加载失败'
          })
        }
        wx.hideLoading()
      },
      fail: err => {
        console.error('获取订单列表失败：', err)
        wx.hideLoading()
        wx.showToast({
          title: '加载失败'
        })
      }
    })
  },

  viewOrderDetail: function (event) {
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