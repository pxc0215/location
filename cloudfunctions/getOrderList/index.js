// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command

  // 从参数中获取集合名称
  const { userCollection, orderCollection } = event

  try {
    // 获取用户角色
    const { data: users } = await db.collection(userCollection)
      .where({
        _openid: wxContext.OPENID
      })
      .get()
    
    const isAdmin = users.length > 0 && users[0].role === 'admin'
    
    // 构建查询条件
    let query = {}
    if (!isAdmin) {
      query = _.or([
        { _openid: wxContext.OPENID },
        { ownerid: wxContext.OPENID }
      ])
    }

    // 查询订单列表
    const { data: orders } = await db.collection(orderCollection)
      .where(query)
      .orderBy('time', 'desc')
      .get()

    return {
      success: true,
      data: orders
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err
    }
  }
}