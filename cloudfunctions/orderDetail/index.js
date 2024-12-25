// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('收到的数据' + event.handle + '---' + event.flowRecord)
  if (event.handle === 'get') {
    return await getOrder(event)
  } else if (event.handle === 'update') {
    return await updateOrder(event)
  }
}

async function getOrder(event) {
  try {
    const {
      orderCollection,
      orderId
    } = event
    // 查询订单详情
    const {
      data: order
    } = await cloud.database().collection(orderCollection)
      .doc(orderId)
      .get()
    return {
      success: true,
      data: order
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
}

async function updateOrder(event) {
  try {
    const {
      orderCollection,
      orderId,
      flowRecord
    } = event
    const db = cloud.database()
    const _ = db.command
    const now = new Date()
    // 更新数据库
    await db.collection(orderCollection).doc(orderId).update({
      data: {
        // 添加新的流转记录
        flowRecords: _.push(flowRecord),
        // 如果状态是"已完成"，更新归档信息
        ...(flowRecord.status === 'completed' ? {
          archived: true,
          archiveTime: now.getTime(),
          archiveUser: flowRecord.userName
        } : {})
      }
    })
    console.log('更新完成')

    return {
      success: true,
      data: flowRecord
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
}