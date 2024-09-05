let u = navigator.userAgent
//向原生注册方式
function setupWebViewJavascriptBridge(callback) {
    if (!/(iPhone|iPad|iPod|iOS)/i.test(u)) {
        //Android使用
        if (window.WebViewJavascriptBridge && window.WebViewJavascriptBridge.inited) {
            callback(window.WebViewJavascriptBridge)
        } else {
            document.addEventListener(
                'WebViewJavascriptBridgeReady',
                () => {
                    callback(window.WebViewJavascriptBridge)
                },
                false
            )
        }
    } else {
        //IOS使用
        if (window.WebViewJavascriptBridge) {
            return callback(window.WebViewJavascriptBridge)
        }
        if (window.WVJBCallbacks) {
            return window.WVJBCallbacks.push(callback)
        }
        window.WVJBCallbacks = [callback]
        let WVJBIframe = document.createElement('iframe')
        WVJBIframe.style.display = 'none'
        WVJBIframe.src = 'https://__bridge_loaded__'
        document.documentElement.appendChild(WVJBIframe)
        setTimeout(() => {
            document.documentElement.removeChild(WVJBIframe)
        }, 0)
    }
}
var taskSdk = function (options) {
    this.url = options.url
    this.token = options.token
    this.incident = {}
    this.messageType = {
        1: 'networkStatusDidChanged',//网络状态变化
        2: 'receiveMessagePush',//业务消息推送
        3: 'accountDidKicked'//账号被踢下线
    }
    //注册回调函数，安卓
    setupWebViewJavascriptBridge(function (bridge) {
        // alert(/(iPhone|iPad|iPod|iOS)/i.test(u))
        if (!/(iPhone|iPad|iPod|iOS)/i.test(u)) {
            // alert(1)
            //android 有init初始化方法，必须调用 不调用后续注册的事件将无效 而IOS却没有init方法 调用会报错
            bridge.init((message, responseCallback) => {
                console.log('JS got a message', message)
                var data = { 'Javascript Responds': '测试中文!' }
                if (responseCallback) {
                    responseCallback(data)
                }
            })
        }
    })
    // }
}
taskSdk.prototype = {
    callhandler(name, data, callback) {
        // 调用客户端的方法
        setupWebViewJavascriptBridge(bridge => {
            bridge.callHandler(name, data, callback)
        })
    },
    registerhandler(name, callback) {
        // 客户端需要调用的js函数
        setupWebViewJavascriptBridge(bridge => {
            bridge.registerHandler(name, (data, responseCallback) => {
                callback(data, responseCallback)
            })
        })
    },
    /**
    *  获取消息 
    * @param {string} name 获取信息的名称
    * @param {*} params 获取消息的参数 
    * @returns 
    */
    getMessage(name, params) {
        return new Promise((resolve, reject) => {
            this.callhandler(name, params, data => {
                resolve(data)
            })
        })
    },
    /**
     * 添加事件回调事件
     * @param {*} eventKey //事件类型键值
     * @param {*} methodName //回调执行事件的名称
     * @param {*} callback //事件体
     */
    addEleEvent(eventKey, methodName, callback) {
        this.incident[methodName] = callback
        this.registerhandler(this.messageType[eventKey], (data, responseCallback) => {
            if (this.messageType[eventKey] == 'networkStatusDidChanged') {
                let dataList = null
                if (typeof data == 'string') {
                    dataList = JSON.parse(data).status
                } else {
                    dataList = data
                }
                this.incident.networkStatusDidChanged(dataList)//已连接
            } else if (this.messageType[eventKey] == 'receiveMessagePush') {
                let dataList = null
                if (typeof data == 'string') {
                    dataList = JSON.parse(data).data
                } else {
                    dataList = data.data
                }
                this.incident.receiveMessagePush(dataList)
            } else {
                this.incident.accountDidKicked(data)
            }
        })
    },
    //接口请求获取业务模块代办汇总信息
    getTaskSummary() {
        return new Promise((resolve, reject) => {
            let url = `${this.url}/api/taskcenter/v1/task/summary?token=${this.token}`
            httpRequest({
                method: 'GET',
                url
            }, resolve, reject)
        })
    },
    /**
     * 分页获取代办信息
     * @param {*} page 页面索引,默认值:1
     * @param {*} pageSize 页面大小,默认值:10
     * @param {*} status 0:未读消息,1:已读消息,默认值:0
     * @param {*} taskModuleId 业务模块id,有值时:获取指定业务模块下的代办信息,时间戳降序(进入二级目录时调用);为空时:不按模块按时间,时间戳降序
     * @returns 
     */
    getTaskList(page = 1, pageSize = 10, status = 0, taskModuleId) {
        return new Promise((resolve, reject) => {
            const data = {
                taskModuleId: taskModuleId,
                page: page,
                pageSize: pageSize,
                status: status
            }
            let url = `${this.url}/api/taskcenter/v1/task/list?token=${this.token}`
            httpRequest({
                method: 'post',
                url,
                data: JSON.stringify(data)
            }, resolve, reject)
        })
    },
    /**
    * 获取最新代办信息
    * @param {*} page 页面索引,默认值:1
    * @param {*} pageSize 页面大小,默认值:10
    * @returns 
    */
    getLatest(page = 1, pageSize = 10) {
        return new Promise((resolve, reject) => {
            const data = {
                page: page,
                pageSize: pageSize,
                status: 0
            }
            let url = `${this.url}/api/taskcenter/v1/task/latest?token=${this.token}`
            httpRequest({
                method: 'post',
                url,
                data: JSON.stringify(data)
            }, resolve, reject)
        })
    },
    //设置代办已读状态
    setTaskReaded(taskIdList) {
        return new Promise((resolve, reject) => {
            let url = `${this.url}/api/taskcenter/v1/task/readed?token=${this.token}`
            httpRequest({
                method: 'PATCH',
                url,
                data: JSON.stringify(taskIdList)
            }, resolve, reject)
        })
    },
    //设置当前用户所以代办已读状态
    setTaskAllRead() {
        return new Promise((resolve, reject) => {
            let url = `${this.url}/api/taskcenter/v1/task/allRead?token=${this.token}`
            httpRequest({
                method: 'PATCH',
                url
            }, resolve, reject)
        })
    },
    /**
     * 注册连接状态改变时的回调
     * @param {*} tyep 类型
     * @param {*} callback 回调体
     */
    onConnectionStatusChanged(callback) {
        this.addEleEvent(1, 'networkStatusDidChanged', callback)
    },
    //注册信息回调
    onReceiveMessage(callback) {
        this.addEleEvent(2, 'receiveMessagePush', callback)
    },
    //注册账号被踢下线
    onOffline(callback) {
        this.addEleEvent(3, 'accountDidKicked', callback)
    },
    //打开客服界面
    openCustomerServiceScreen() {
        this.callhandler('pushMerchantConversation', {
            msg: '打开会话',
            name: 'H5发送的',
            type: 1
        }, data => { })
    }
}

//js原生请求方式
function httpRequest(obj, resolve, reject) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open(obj.method, obj.url, true);
    httpRequest.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    httpRequest.timeout = 50000;
    httpRequest.withCredentials = true;
    // 返回处理
    httpRequest.onload = () => {
        var res = JSON.parse(httpRequest.responseText);
        if (res.code == 0) {
            return resolve(res.data)
        } else {
            return reject(res.msg)
        }
    };
    httpRequest.onerror = (err) => {
        return reject('接口错误')
    };
    httpRequest.send(obj.data);// 发送请求
}
