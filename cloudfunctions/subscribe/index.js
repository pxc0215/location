// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取所有管理员用户
    const db = cloud.database()
    const env = require('../../envList.js').dev
    const { data: admins } = await db.collection(`users_${env}`)
      .where({
        role: 'admin'
      })
      .get()

    // 发送订阅消息给所有管理员
    const sendPromises = admins.map(admin => {
      return cloud.openapi.subscribeMessage.send({
        touser: admin._openid,
        templateId: 'GKphq3I8BUCF_l-zApo8jj1u3nMi1HUYp5OL5bjIV74',
        data: {
          thing2: { value: event.address },
          thing9: { value: event.userName },
          date6: { value: event.createTime },
          thing11: { value: event.remark }
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