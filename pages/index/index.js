const { API, sleep, req_post } = require('../../common.js');
const regeneratorRuntime = require('../../lib/regenerator-runtime/runtime');

//index.js

//获取应用实例
const app = getApp();

Page({
  data: {
    wording: Math.random(),

    scanResult: '',

    userInfo: {},
    hasUserInfo: false,

    location: {},
    hasLocation: false,
  },


  // 在app.json里绑定了tab，页面里的跳转就不生效了
  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../webview/index',
    });
  },


  onShareAppMessage: function () {
    return {
      title: '自定义转发标题',
      path: '/pages/index/index',
    };
  },


  onBtnClick: function () {
    wx.scanCode({
      success: (res) => {
        /*
        charSet: "UTF-8"
        errMsg: "scanCode:ok"
        rawData: "NTY0M3JkZDg="
        result: "5643rdd8"
        scanType: "QR_CODE"
        */
        console.log('index.scanCode 扫码结果', res.result);
        this.setData({
          scanResult: '扫描结果: ' + res.result,
        });
      }

    })
  },


  onBtnClick2: function () {
    wx.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      success: (res) => {
        /*
        accuracy: 65
        errMsg: "getLocation:ok"
        horizontalAccuracy: 65
        latitude: 39.9219
        longitude: 116.44355
        speed: -1
        verticalAccuracy: 65
        */

        this.setData({
          location: res,
          hasLocation: true,
        });

        console.log('index.onLoad:wx.getLocation:gcj02 res', res)
        // wx.openLocation({
        //   latitude,
        //   longitude,
        //   scale: 18
        // })
      },
    });
  },


  onBtnClick3: function () {
    // wx.openSetting({
    //   success: (res) => {
    //     if (res.authSetting["scope.userLocation"] == true) {
    //       wx.showToast({
    //         title: '授权成功',
    //         icon: 'success',
    //         duration: 1000
    //       })
    //       //再次授权，调用wx.getLocation的API
    //       app.geo();
    //     } else {
    //       wx.showToast({
    //         title: '授权失败',
    //         icon: 'none',
    //         duration: 1000
    //       })
    //     }
    //   }
    // })


    wx.getSetting({
      success: res => {

        console.log('index.onLoad:wx.getSetting:res', res);

        if (res.authSetting['scope.userLocation']) {
          console.log('授权成功');
          //调用wx.getLocation的API
          //app.geo();
        }

        else if (res.authSetting['scope.userLocation'] === false) {
          wx.openSetting({
            success: (res) => {
              if (res.authSetting["scope.userLocation"] == true) {
                wx.showToast({
                  title: '授权成功',
                  icon: 'success',
                  duration: 1000
                })
                //再次授权，调用wx.getLocation的API
                app.geo();
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

        else if (res.authSetting['scope.userLocation'] === undefined) {
          //用户首次进入页面,调用wx.getLocation的API
          //app.geo();
        } else {
          // never be here!
        }

      } 
    })

  },


  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
      });
    } else {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
        });
      }
    } 

    
    if (app.globalData.location) {
      this.setData({
        location: app.globalData.location,
        hasLocation: true,
      })
    } else {
      app.locationReadyCallback = res => {
        this.setData({
          location: res,
          hasLocation: true,
        });
      }
    }


    wx.getSystemInfo({
      success: (res) => {
        console.log(res)
        console.log(this)
        this.setData({
          wording: res.model + ', ' + res.system,
        });
      }
    });


    

  },



  getUserInfo: async function (e) {
    console.log('index.getUserInfo: e', e);
    let { userInfo, encryptedData, iv, signature, } = e.detail;

    // 用户拒接授权，nothing can do
    if (!userInfo) {
      return;
    }

    let resultFromSrv = await req_post(API.SAVE_USERINFO, {
      userInfo,
      encryptedData,
      iv,
      signature,
    });
    // 发送到后端保存
    console.log('index.getUserInfo:resultFromSrv', resultFromSrv);

    app.globalData.userInfo = userInfo;
    this.setData({
      userInfo: userInfo,
      hasUserInfo: true,
    });
  },


})
