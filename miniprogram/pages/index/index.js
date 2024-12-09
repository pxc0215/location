const app = getApp()
let that = null // 页面this指针变量
let db = wx.cloud.database()

Page({
  data: {
    files: [],
    location: '-', // 纬度度
    address: '位置',
    desc: '',
    openId: '',
    userName: '登录',
    avatarUrl: '../../asset/user_center.png'
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
    var storageUserName = wx.getStorageSync('user_name')
    var storageAvatarUrl = wx.getStorageSync('avatar_url')
    that.setData({
      userName: storageUserName ? storageUserName : '登录',
      avatarUrl: storageAvatarUrl ? storageAvatarUrl : '../../asset/logo.png'
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
      that.setData({ // 将信息存储data数据
        location: res.location,
        address: res.address + '-' + res.formatted
      })
    })
  },

  async makePhoto() {
    wx.showLoading({
      title: '',
    });
    wx.chooseMedia({
      count: 1,
      success: res => {
        const file = res.tempFiles[0]
        var name = Date.parse(new Date());
        var dev = require('../../envList.js').dev
        // 将图片上传至云存储空间
        wx.cloud.uploadFile({
          // 指定上传到的云路径
          cloudPath: 'traffic_' + dev + '/' + name + '.png',
          // 指定要上传的文件的小程序临时文件路径
          filePath: file.tempFilePath,
          success: result => {
            console.log('上传成功', result);
            this.data.files.push({
              name: name + '.png',
              size: (file.size / 1024 / 1024).toFixed(2),
              id: result.fileID
            })
            this.setData({
              files: this.data.files
            });
            wx.hideLoading();
          },
          fail: e => {
            console.log(e);
            wx.hideLoading();
          }
        })
      }
    })
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
    var username = wx.getStorageSync('user_name')
    if (username) {
      // goto 个人中心or订单列表
      wx.navigateTo({
        url: '../orderlist/orderlist'
      })
    } else {
      wx.getUserProfile({
        desc: '用于完善资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: (res) => {
          wx.setStorageSync('user_name', res.userInfo.nickName)
          wx.setStorageSync('avatar_url', res.userInfo.avatarUrl)
          that.setData({
            userName: res.userInfo.nickName,
            avatarUrl: res.userInfo.avatarUrl
          })
        }
      })
    }
  },

  // 提交
  async submit() {
    // 对输入内容进行校验
    if (this.data.desc.length > 100) {
      wx.showToast({
        title: '备注信息太长',
        icon: 'error',
        duration: 2000
      })
      return
    }
    var timestamp = new Date().time
    var env = require('../../envList.js').dev
    // 在数据库中新建一条记录
    db.collection(app.globalData.collection_order + '_' + env).add({
      data: {
        ownerid: this.data.openId,
        ownername: this.data.userName,
        sectionid: '11111', // 预留字段，以后用于订单可见性的权限处理
        files: this.data.files, // 图片列表
        location: this.data.location, // 经纬度
        address: this.data.address, // 地址文案
        desc: this.data.desc, // 描述
        star: false,
        time: timestamp
      }
    }).then(res => {
      wx.showToast({
        title: '提交成功',
      })
      // wx.navigateBack({
      //   delta: 0,
      // })
    })
  },
  onShareAppMessage() {
    return {
      title: '快来随手拍交通事故',
      imageUrl: '../../asset/logo.png'
    }
  }
})