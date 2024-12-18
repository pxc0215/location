const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    userInfo: {
      nickName: '',
      avatarUrl: '',
      company: ''
    },
    openId: '',
    hasChanged: false
  },

  onLoad() {
    // 获取存储的用户信息
    const nickName = wx.getStorageSync('user_name')
    const avatarUrl = wx.getStorageSync('avatar_url')
    const company = wx.getStorageSync('company')
    const openId = wx.getStorageSync('open_id')

    this.setData({
      userInfo: {
        nickName,
        avatarUrl,
        company
      },
      openId
    })
  },

  // 点击头像
  onTapAvatar() {
    wx.showToast({
      title: '暂不支持修改头像',
      icon: 'none'
    })
  },

  // 输入昵称
  onInputNickname(e) {
    const newNickname = e.detail.value
    this.setData({
      'userInfo.nickName': newNickname,
      hasChanged: true
    })
  },

  // 输入企业名称
  onInputCompany(e) {
    const newCompany = e.detail.value
    this.setData({
      'userInfo.company': newCompany,
      hasChanged: true
    })
  },

  // 保存用户信息
  async saveUserInfo() {
    if (!this.data.hasChanged) {
      wx.navigateBack()
      return
    }

    const { nickName, company } = this.data.userInfo
    const openId = this.data.openId

    if (!nickName) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...'
    })

    try {
      var env = require('../../envList.js').dev
      const userCollection = db.collection(app.globalData.collection_user + '_' + env)
      const { data } = await userCollection.where({
        _openid: openId
      }).get()

      if (data.length > 0) {
        // 更新现有记录
        await userCollection.doc(data[0]._id).update({
          data: {
            nickName,
            company
          }
        })
      } else {
        // 创建新记录
        await userCollection.add({
          data: {
            nickName,
            avatarUrl: this.data.userInfo.avatarUrl,
            company
          }
        })
      }

      // 更新本地存储
      wx.setStorageSync('user_name', nickName)
      wx.setStorageSync('company', company)

      // 获取页面实例并更新数据
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage) {
        prevPage.setData({
          userName: nickName
        })
      }

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('保存用户信息失败：', error)
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  }
}) 