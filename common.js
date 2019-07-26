function sleep(n) {
  return new Promise(res => {
    setTimeout(res, n)
  });
}


function stringifyParams(params) {
  if (!params) return '';
  return Object.keys(params)
    .map((key) => (key + '=' + encodeURIComponent(params[key])))
    .join('&');
}


function req_post(url, params = {}, headers={}) {
  return new Promise(resolve => {
    wx.request({
      url: url + '?sessionID=' + wx.getStorageSync('sessionID'),
      method: 'POST',
      data: params,
      header: Object.assign({ 'content-type': 'application/json' }, headers),
      success: (res) => {
        console.log('common.req_post:wx.request: success', res);
        resolve(res);
      },
      fail: (res) => {
        console.log('common.req_post:wx.request: fail', res);
        resolve(res);
      }
    });
  });
}


function req_get(url, params = {}, headers = {}) {
  return new Promise(resolve => {
    wx.request({
      url: url + '?sessionID=' + wx.getStorageSync('sessionID') + '&' + stringifyParams(params),
      method: 'GET',
      header: headers,
      success: (res) => {
        console.log('common.req_get:wx.request: success', res);
        resolve(res);
      },
      fail: (res) => {
        console.log('common.req_get:wx.request: fail', res);
        resolve(res);
      }
    });
  });
}


// const API = {
//   CHECK_SESSION: 'http://10.252.143.36:80/miniprogram/checkSession/',
//   SILENT_LOGIN: 'http://10.252.143.36:80/miniprogram/silentLogin/',
//   SAVE_USERINFO: 'http://10.252.143.36:80/miniprogram/saveUserInfo/',
// }
const API = {
  CHECK_SESSION: 'https://jrlog.58.com/miniprogram/checkSession/',
  SILENT_LOGIN: 'https://jrlog.58.com/miniprogram/silentLogin/',
  SAVE_USERINFO: 'https://jrlog.58.com/miniprogram/saveUserInfo/',
}


module.exports.API = API;
module.exports.sleep = sleep;
module.exports.req_get = req_get;
module.exports.req_post = req_post;
