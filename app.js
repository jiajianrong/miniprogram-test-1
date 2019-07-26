const { API } = require('./common.js');

//app.js
App({

  checkSessionStatus: function() {

    return new Promise((resolve, reject) => {
      // 获取登录状态
      var sessionID = wx.getStorageSync('sessionID') || '';
      console.log('app.checkSessionStatus: sessionID', sessionID);

      // 未登录过
      if (!sessionID) {
        resolve({
          code: 1,
          msg: '客户端session不存在，需重新wx.login()',
        });
      
      // 以前登录过，需要判断session状态
      } else {
        
        Promise.all([ this.req_checkClientSession(), this.req_checkServerSession(sessionID) ]).then(valueArr => {
          
          if (valueArr[0].code===0 && valueArr[1].code===0) {
            console.log('app.checkSessionStatus: 有效', sessionID);
            resolve({
              code: 0,
              msg: 'session有效',
            });

          } else {
            console.log('app.checkSessionStatus: 无效', sessionID);
            resolve({
              code: 1,
              msg: 'session无效',
            });
          }

        });
      }
    });
    
  },


  // 判断客户端session是否过期
  req_checkClientSession: function() {

    return new Promise((resolve, reject) => {
      // 判断session_key是否过期
      wx.checkSession({
        success() {
          //session_key 未过期，并且在本生命周期一直有效
          console.log('App.req_checkClientSessionwx:wx.checkSession:success');
          resolve({
            code: 0,
            msg: '客户端session信息有效',
          });
        },
        fail() {
          // session_key 已经失效，需要重新执行登录流程
          console.log('App.req_checkClientSessionwx:wx.checkSession:fail');
          resolve({
            code: 1,
            msg: '客户端session信息失效，需重新wx.login()',
          });
        }
      });
    });
    
  },


  // 判断服务端session是否过期
  req_checkServerSession: function (sessionID) {

    return new Promise((resolve, reject) => {
      // 判断session_key是否过期
      wx.request({
        url: API.CHECK_SESSION,
        data: {
          sessionID,
        },
        success: (res) => {
          let { code, data } = res.data;

          if (code === 0) {
            console.log('App.req_checkServerSession:success', sessionID);
            resolve({
              code: 0,
              msg: '服务器端session有效',
              data,
            });

          } else {
            console.log('App.req_checkServerSession:fail', sessionID);
            resolve({
              code: 1,
              msg: '服务器端session无效或已过期',
            });
          }
        },
      });
    });

  },



  silentLogin: function() {
    return this.req_clientSilentLogin().then(data=>{
      if (data.code===0) {
        this.req_serverSilentLogin(data.wxTempCode).then(data=>{
          let { sessionID } = data.data;
          // 记录sessionID到客户端存储
          wx.setStorageSync('sessionID', sessionID);
          console.log('App.silentLogin:登录成功 sessionID已写入客户端', sessionID)
        });
      
      } else {
        console.log('App.silentLogin:登录失败 data', data)
      }
    });
      
  },



  req_clientSilentLogin: function() {
    
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          console.log('App.req_clientSilentLogin:wx.login res', res);
          
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          if (res.code) {
            console.log('App.req_clientSilentLogin:wx.login code' + res.code);
            resolve({
              code: 0,
              msg: '',
              wxTempCode: res.code,
            });

          } else {
            console.log('App.req_clientSilentLogin:wx.login errMsg' + res.errMsg);
            resolve({
              code: 1,
              msg: res.errMsg,
            });
          }
        }
      });
    })

  },



  req_serverSilentLogin: function(code) {

    return new Promise((resolve, reject) => {
      wx.request({
        url: API.SILENT_LOGIN,
        data: {
          code,
        },
        success: (res) => {
          console.log('App.req_serverSilentLogin: 服务器回包信息', res);
          resolve(res.data);
        }
      });
    })
    
  },



  onLaunch: function () {
    
    this.checkSessionStatus().then(data => {
      if (data.code===0) {
        // wx.getSetting();
        console.log('app.onLaunch: 已经是登录状态', data);

      } else {
        this.silentLogin();
      }
    });


    // 获取用户信息
    wx.getSetting({
      success: res => {
        
        console.log('App.onLaunch:wx.getSetting:res', res);
        
        if (res.authSetting['scope.userInfo']) {
          console.log('App.onLaunch:wx.getSetting:已经授权');
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo;

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res);
              }
            },
          });
        }

        
        // res.authSetting['scope.userLocation'] == undefined    表示 初始化进入该页面
        // res.authSetting['scope.userLocation'] == false    表示 非初始化进入该页面,且未授权
        // res.authSetting['scope.userLocation'] == true    表示 地理位置授权

        if (res.authSetting['scope.userLocation']) {
          console.log('授权成功');
          //调用wx.getLocation的API
          this.geo();
        }
        
        else if (res.authSetting['scope.userLocation'] === false) {

          //未授权
          wx.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: (res) => {
              if (res.cancel) {
                //取消授权
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (res.confirm) {
                //确定授权，通过wx.openSetting发起授权请求
                wx.openSetting({
                  success: (res) => {
                    if (res.authSetting["scope.userLocation"] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API
                      this.geo();
                    } else {
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] === undefined) {
          //用户首次进入页面,调用wx.getLocation的API
          //this.geo();
        } else {
          // never be here!
        }


      },
    });

  },



  geo() {
    
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        // const latitude = res.latitude
        // const longitude = res.longitude
        // const speed = res.speed
        // const accuracy = res.accuracy
        console.log('app.geo:wx.getLocation:succ res', res);
        this.globalData.location = res;

        if (this.locationReadyCallback) {
          this.locationReadyCallback(res);
        }
      }
    })
  },



  globalData: {
    userInfo: null,
    location: null,
  }
})