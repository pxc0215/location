// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  return await getUser(event.openId, event.collectionName);
}

// 获取用户信息
async function getUser(openId, collectionName) {
  try {
    // 查询用户详情
    const result = await cloud.database().collection(collectionName)
      .where({
        _openid: openId
      })
      .get()
    if (result.data.length > 0) {
      // Return the first object in the list
      return {
        success: true,
        data: result.data[0]
      };
    } else {
      return {
        success: false,
        message: 'No user found'
      };
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
}

// // 更新订单
// async function updateOrder(event) {
//   try {
//     const {
//       orderCollection,
//       orderId,
//       flowRecord
//     } = event
//     const db = cloud.database()
//     const _ = db.command
//     const now = new Date()
//     // 更新数据库
//     await db.collection(orderCollection).doc(orderId).update({
//       data: {
//         // 添加新的流转记录
//         flowRecords: _.push(flowRecord),
//         // 如果状态是"已完成"，更新归档信息
//         ...(flowRecord.status === 'completed' ? {
//           archived: true,
//           archiveTime: now.getTime(),
//           archiveUser: flowRecord.userName
//         } : {})
//       }
//     })

//     return {
//       success: true,
//       data: flowRecord
//     }
//   } catch (err) {
//     console.error(err)
//     return {
//       success: false,
//       error: err
//     }
//   }
// }