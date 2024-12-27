const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    userInfo: {
      nickName: '',
      avatarUrl: '',
      company: '',
      phoneNumber: ''
    },
    openId: '',
    hasChanged: false,
    isAdmin: false
  },

  onLoad() {
    // Attempt to load user data from local storage
    const nickName = wx.getStorageSync('user_name') || ''
    const avatarUrl = wx.getStorageSync('avatar_url') || ''
    const company = wx.getStorageSync('company') || ''
    const phoneNumber = wx.getStorageSync('phone_number') || ''

    this.setData({
      userInfo: {
        nickName,
        avatarUrl,
        company,
        phoneNumber
      }
    })

    // Check if any data is missing，then fetch from cloud database
    if (!nickName || !avatarUrl || !company || !phoneNumber) {
      console.log('需要从云数据库中获取数据')
      const openId = wx.getStorageSync('open_id')
      if (openId) {
        // Fetch user data from the cloud database
        const userCollection = db.collection(app.globalData.collection_user + '_' + require('../../envList.js').dev)
        userCollection.where({
          _openid: openId
        }).get().then(res => {
          if (res.data.length > 0) {
            const userData = res.data[0]
            this.setData({
              userInfo: {
                nickName: userData.nickName || '',
                avatarUrl: userData.avatarUrl || '',
                company: userData.company || '',
                phoneNumber: userData.phoneNumber || ''
              },
              openId
            })
            // Update local storage with fetched data
            wx.setStorageSync('user_name', userData.nickName)
            wx.setStorageSync('avatar_url', userData.avatarUrl)
            wx.setStorageSync('company', userData.company)
            wx.setStorageSync('phone_number', userData.phoneNumber)
          }
        }).catch(error => {
          console.error('Failed to fetch user data:', error)
        })
      }
    }

    // 检查是否为管理员
    const userRole = wx.getStorageSync('user_role')
    this.setData({
      isAdmin: userRole === 'admin'
    })
  },

  loadLocalData() {
    // Load user data from local storage
    const nickName = wx.getStorageSync('user_name') || ''
    const avatarUrl = wx.getStorageSync('avatar_url') || ''
    const company = wx.getStorageSync('company') || ''
    const phoneNumber = wx.getStorageSync('phone_number') || ''

    this.setData({
      userInfo: {
        nickName,
        avatarUrl,
        company,
        phoneNumber
      }
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

  // 获取手机号
  async getPhoneNumber(e) {
    if (e.detail.errMsg !== "getPhoneNumber:ok") {
      wx.showToast({
        title: '获取手机号失败',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '获取中...'
    })

    try {
      // 调用云函数解密手机号
      const result = await wx.cloud.callFunction({
        name: 'getPhoneNumber',
        data: {
          cloudID: e.detail.cloudID
        }
      })

      const phoneNumber = result.result.phoneInfo.phoneNumber
      this.setData({
        'userInfo.phoneNumber': phoneNumber,
        hasChanged: true
      })
      wx.setStorageSync('phone_number', phoneNumber)
      wx.hideLoading()
    } catch (error) {
      console.error('获取手机号失败：', error)
      wx.hideLoading()
      wx.showToast({
        title: '获取手机号失败',
        icon: 'none'
      })
    }
  },

  // 手动输入手机号
  onInputPhone(e) {
    this.setData({
      'userInfo.phoneNumber': e.detail.value,
      hasChanged: true
    })
  },

  // 保存用户信息
  async saveUserInfo() {
    if (!this.data.hasChanged) {
      wx.navigateBack()
      return
    }

    const { nickName, phoneNumber, company } = this.data.userInfo
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
            company,
            phoneNumber,
            role: data[0].role || 'user'
          }
        })
      } else {
        // 创建新记录
        await userCollection.add({
          data: {
            nickName,
            avatarUrl: this.data.userInfo.avatarUrl,
            company,
            phoneNumber,
            role: 'user'
          }
        })
      }

      // 更新本地存储
      wx.setStorageSync('user_name', nickName)
      wx.setStorageSync('company', company)
      wx.setStorageSync('phone_number', phoneNumber)

      // 更新首页显示
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
  },

  // 长按头像文字处理
  onLongPressLabel: function(e) {
    if (this.data.isAdmin) {
      wx.navigateTo({
        url: '/pages/usermanage/userManage'
      })
    }
  }
}) 