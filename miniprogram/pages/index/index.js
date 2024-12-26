const app = getApp()
let that = null // 页面this指针变量
let db = wx.cloud.database()

Page({
  data: {
    files: [],
    tempFiles: [], // 新增：存储临时文件路径
    location: '-', // 纬度度
    address: '位置',
    desc: '',
    openId: '',
    userName: '',
    avatarUrl: '../../asset/user_center.png',
    showMenu: false,
    isLogin: false
  },
  /**
   * 页面装载回调
   */
  onLoad() {
    that = this // 设置页面this指针到全局that
    this.tryToLogin()
    this.tryToLocation()
  },

  onShow() {
    var openid = wx.getStorageSync('open_id')
    if (openid) {
      this.data.openId = openid
    } else {
      // 通过云函数调用获取用户 _openId
      app.getOpenId().then(async openid => {
        this.data.openId = openid
        wx.setStorageSync('open_id', openid)
      })
    }
  },

  tryToLogin() {
    const storageUserName = wx.getStorageSync('user_name')
    const storageAvatarUrl = wx.getStorageSync('avatar_url')
    that.setData({
      userName: storageUserName || '',
      avatarUrl: storageAvatarUrl || '../../asset/user_center.png'
    })
  },

  tryToLocation() {
    wx.getLocation({ // 获取当前位置
      type: 'gcj02', // gcj02火星坐标系，用于地图标记点位
      success(res) { // 获取成功
        console.log(res)
        that.setData({
          location: `${res.latitude},${res.longitude}`
        }) // 设置经纬度信息
        that.getLocation(res.latitude, res.longitude) // 获取当前位置点
      },
      fail(e) { // 获取失败
        if (e.errMsg.indexOf('auth deny') !== -1) { // 如果是权限拒绝
          wx.showModal({ // 显示提示
            content: '你已经拒绝了定位权限，将无法获取到你的位置信息，可以选择前往开启',
            success(res) {
              if (res.confirm) { // 确认后
                wx.openSetting() // 打开设置页，方便用户开启定位
              }
            }
          })
        }
      }
    })
  },
  /**
   * 请求获取经纬度的详细信息
   * @param {object} data 经纬度信息
   */
  async getLocation(latitude, longitude) {
    await app.call({ // 发起云函数请求
      name: 'location', // 业务为location，获取经纬度信息
      data: { // 传入经纬度信息
        location: `${latitude},${longitude}`
      },
      load: false // 不显示加载loading，静默执行
    }).then((res) => { // 请求成功后
      console.log(res)
      that.setData({ // 将信息储data数据
        location: res.location,
        address: res.address + '-' + res.formatted
      })
    })
  },

  async makePhoto() {
    if (this.data.tempFiles.length >= 3) {
      wx.showToast({
        title: '最多上传3张照片',
        icon: 'none'
      })
      return
    }

    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      })

      // 只存储临时路径
      this.setData({
        tempFiles: [...this.data.tempFiles, {
          tempFilePath: res.tempFiles[0].tempFilePath,
          id: `temp_${Date.now()}` // 临时ID用于预览和删除
        }]
      })

    } catch (error) {
      console.error(error)
      wx.showToast({
        title: '选择照片失败',
        icon: 'none'
      })
    }
  },
  // 表单输入处理函数
  onDescInput(e) {
    this.setData({
      desc: e.detail.value
    })
  },
  tomap() {
    wx.navigateTo({
      url: '../map/map'
    })
  },
  async getUserProfile() {
    // 显示加载中
    wx.showLoading({
      title: '微信账户登录中...',
      mask: true // 添加遮罩层防止重复点击
    })

    try {
      // 获取用户信息
      const res = await wx.getUserProfile({
        desc: '用于完善会员资料'
      })
      
      console.log("获取用户信息成功", res)
      const userInfo = res.userInfo
      that.setData({
        userName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      })
      wx.setStorageSync('user_name', userInfo.nickName)
      wx.setStorageSync('avatar_url', userInfo.avatarUrl)

      // 获取用户openId
      const openIdRes = await wx.cloud.callFunction({
        name: 'getOpenId'
      })
      
      console.log("云函数调用成功", openIdRes)
      that.setData({
        openId: openIdRes.result.openid
      })
      wx.setStorageSync('open_id', openIdRes.result.openid)

      // 获取存储的用户信息
      const db = wx.cloud.database()
      var env = require('../../envList.js').dev
      const userRes = await db.collection(app.globalData.collection_user + '_' + env)
        .where({
          _openid: openIdRes.result.openid
        })
        .get()

      if (userRes.data && userRes.data.length > 0) {
        wx.setStorageSync('user_name', userRes.data[0].nickName)
        wx.setStorageSync('user_role', userRes.data[0].role || 'user')
        
        // 如果是管理员或会员，请求订阅消息授权
        if (['admin', 'member'].includes(userRes.data[0].role)) {
          try {
            await wx.requestSubscribeMessage({
              tmplIds: ['GKphq3I8BUCF_l-zApo8jj1u3nMi1HUYp5OL5bjIV74']
            })
          } catch (err) {
            console.error('订阅消息授权失败：', err)
            // 这里的错误可以忽略，不影响登录流程
          }
        }
      } else {
        wx.setStorageSync('user_role', 'user')
      }

      that.setData({
        isLogin: true,
        userName: userRes.data[0].nickName
      })

      wx.hideLoading()
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

    } catch (err) {
      wx.hideLoading()
      console.error('登录失败：', err)
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      })
    }
  },

  // 提交
  async submit() {
    if (this.data.desc.length > 100) {
      wx.showToast({
        title: '备注信息太长',
        icon: 'error',
        duration: 2000
      })
      return
    }

    wx.showLoading({
      title: '提交中...',
      mask: true
    })

    try {
      const uploadedFiles = []
      var dev = require('../../envList.js').dev

      // 如果有照片，先统一上传
      if (this.data.tempFiles.length > 0) {
        // 并行上传所有图片
        const uploadTasks = this.data.tempFiles.map(file => {
          return wx.cloud.uploadFile({
            cloudPath: `traffic_${dev}/accident_${Date.now()}_${Math.random().toString(36).slice(2)}.png`,
            filePath: file.tempFilePath
          })
        })

        const uploadResults = await Promise.all(uploadTasks)
        uploadedFiles.push(...uploadResults.map(res => ({ id: res.fileID })))
      }

      var timestamp = Date.now()
      const avatarUrl = wx.getStorageSync('avatar_url') || '/asset/default_avatar.png'

      // 创建订单
      await db.collection(app.globalData.collection_order + '_' + dev).add({
        data: {
          ownerid: this.data.openId,
          ownername: this.data.userName,
          ownerAvatarUrl: avatarUrl,
          sectionid: '11111',
          files: uploadedFiles,
          location: this.data.location,
          address: this.data.address,
          desc: this.data.desc,
          star: false,
          time: timestamp
        }
      })

      // 调用订阅消息云函数
      await wx.cloud.callFunction({
        name: 'subscribe',
        data: {
          address: this.data.address,
          userName: this.data.userName,
          createTime: new Date(timestamp).toLocaleString(),
          remark: this.data.desc || '无备注'
        }
      })

      wx.hideLoading()
      wx.showToast({
        title: '提交成功',
      })

      // 清空临时文件
      this.setData({
        tempFiles: [],
        desc: ''
      })

    } catch (error) {
      console.error('提交失败：', error)
      wx.hideLoading()
      wx.showToast({
        title: '提交失败',
        icon: 'error'
      })
    }
  },
  onShareAppMessage() {
    return {
      title: '快来随手拍交通事故',
      imageUrl: '../../asset/logo.png'
    }
  },
  // 跳转到历史记录页面
  toOrderList() {
    wx.navigateTo({
      url: '../orderlist/orderlist'
    })
  },

  // 处理退出登录
  handleLogout() {
    this.setData({
      showMenu: false
    });
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('user_name');
          wx.removeStorageSync('avatar_url');

          this.setData({
            userName: '',
            avatarUrl: '../../asset/user_center.png'
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 2000
          });
        }
      }
    });
  },

  // 显示用户菜单
  showUserMenu() {
    if (!this.data.userName || this.data.userName === '登录') {
      // 未登录时，触发登录
      this.getUserProfile();
      return;
    }
    this.setData({
      showMenu: !this.data.showMenu
    });
  },

  // 跳转到个人信息页面
  toUserInfo() {
    this.setData({
      showMenu: false
    });
    wx.navigateTo({
      url: '../userInfo/userInfo'
    });
  },

  // 点击页面其他区域关闭菜单
  onTapPage() {
    if (this.data.showMenu) {
      this.setData({
        showMenu: false
      });
    }
  },

  // 隐藏菜单
  hideMenu() {
    this.setData({
      showMenu: false
    });
  },

  // 新增预览图片方法
  previewImage(e) {
    const urls = this.data.tempFiles.map(file => file.tempFilePath)
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: urls
    })
  },

  // 新增删除图片方法
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index
    const tempFiles = [...this.data.tempFiles]
    tempFiles.splice(index, 1)
    this.setData({ tempFiles })
  }
})