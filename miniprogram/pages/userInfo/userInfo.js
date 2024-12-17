Page({
  data: {
    userInfo: {
      nickName: '',
      avatarUrl: ''
    }
  },

  onLoad() {
    this.setData({
      userInfo: {
        nickName: wx.getStorageSync('user_name'),
        avatarUrl: wx.getStorageSync('avatar_url')
      }
    });
  },

  // 更新昵称
  updateNickname(e) {
    const newNickname = e.detail.value;
    if (newNickname) {
      wx.setStorageSync('user_name', newNickname);
      this.setData({
        'userInfo.nickName': newNickname
      });
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
    }
  }
}); 