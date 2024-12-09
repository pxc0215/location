// 云函数入口文件
const cloud = require('wx-server-sdk')
const request = require('request') // 引用request模块

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  let appid = wxContext.APPID
  let appSecret = '753c5a3effa3324f57babca7a308e223'
  let code = event.code
  return new Promise((resolve, reject) => {
    request({ // 开始请求
      method: 'GET',
      url: `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    }, function (error, response) {
      if (error) {
        reject(error)
      }
      else {
        // body:"{"session_key":"XRiOjxhABHO5HzKKb7p97Q==","openid":"op0-G5DGMO8p9TJiNoaEc06wlXD8"}"
        resolve(response.body)
      }
    })
  })
}