// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取所有管理员和会员用户
    const db = cloud.database()
    const collectionName = event.collectionName
    const _ = db.command

    const { data: notifyUsers } = await db.collection(collectionName)
      .where({
        role: _.in(['admin', 'member'])
      })
      .get()
    // Validate and log data
    const address = event.address || '无地址'
    const userName = event.userName || '未知用户'
    const createTime = event.createTime || new Date().toLocaleString()
    const remark = event.remark || '无备注'

    console.log('Sending subscription message with data:', {
      address,
      userName,
      createTime,
      remark
    })

    // 发送订阅消息给管理员和会员用户
    const sendPromises = notifyUsers.map(user => {
      return cloud.openapi.subscribeMessage.send({
        touser: user._openid,
        page: 'orderlist',
        templateId: 'GKphq3I8BUCF_l-zApo8jj1u3nMi1HUYp5OL5bjIV74',
        data: {
          thing2: { value: address.substring(0, 20) }, // Ensure it doesn't exceed 20 characters
          thing9: { value: userName.substring(0, 20) },
          date6: { value: createTime },
          thing11: { value: remark.substring(0, 20) }
        }
      })
    })
    await Promise.all(sendPromises)
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: err }
  }
}