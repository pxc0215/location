const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    userInfo: {
      nickName: '',
      avatarUrl: ''
    },
    openId: '',
    hasChanged: false  // 标记是否修改过昵称
  },

  onLoad() {
    // 获取存储的用户信息
    const nickName = wx.getStorageSync('user_name')
    const avatarUrl = wx.getStorageSync('avatar_url')
    const openId = wx.getStorageSync('open_id')

    this.setData({
      userInfo: {
        nickName,
        avatarUrl
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

  // 保存用户信息
  async saveUserInfo() {
    if (!this.data.hasChanged) {
      wx.navigateBack()
      return
    }

    const { nickName } = this.data.userInfo
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
      // 查询是否已存在用户记录
      var env = require('../../envList.js').dev
      const userCollection = db.collection(app.globalData.collection_user + '_' + env)
      const { data } = await userCollection.where({
        _openid: openId
      }).get()

      if (data.length > 0) {
        // 更新现有记录
        await userCollection.doc(data[0]._id).update({
          data: {
            nickName
          }
        })
      } else {
        // 创建新记录
        await userCollection.add({
          data: {
            nickName,
            avatarUrl: this.data.userInfo.avatarUrl
          }
        })
      }

      // 更新本地存储
      wx.setStorageSync('user_name', nickName)

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 延迟返回上一页
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