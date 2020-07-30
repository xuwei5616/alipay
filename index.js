var fs = require("fs");
var utl = require("./libs");

var alipay_gate_way = "https://openapi.alipay.com/gateway.do";
var alipay_gate_way_sandbox = "https://openapi.alipaydev.com/gateway.do";

/**
 *
 * @param {Object} opts
 * @param {String} opts.appId  支付宝的appId
 * @param {String} opts.notifyUrl  支付宝服务器主动通知商户服务器里指定的页面http/https路径
 * @param {String} opts.rsaPrivate  商户私钥pem文件路径
 * @param {String} opts.rsaPublic  支付宝公钥pem文件路径
 * @param {String} opts.signType   签名方式, 'RSA' or 'RSA2'
 * @param {Boolean} [opts.sandbox] 是否是沙盒环境
 * @constructor
 */
function Alipay(opts) {
  this.appId = opts.appId;
  this.sandbox = !!opts.sandbox;
  this.notifyUrl = opts.notifyUrl;
  this.signType = opts.signType;
  this.rsaPrivate = fs.readFileSync(opts.rsaPrivate, "utf-8");
  this.rsaPublic = fs.readFileSync(opts.rsaPublic, "utf-8");
}

var props = Alipay.prototype;

props.makeParams = function (method, biz_content) {
  return {
    app_id: this.appId,
    method: method,
    format: "JSON",
    charset: "utf-8",
    sign_type: this.signType,
    timestamp: new Date().format("yyyy-MM-dd hh:mm:ss"),
    version: "1.0",
    biz_content: JSON.stringify(biz_content)
  };
};
props.makeSmileParams = function (method, zimmetainfo) {
  return {
    app_id: this.appId,
    method: method,
    format: "JSON",
    charset: "utf-8",
    sign_type: this.signType,
    timestamp: new Date().format("yyyy-MM-dd hh:mm:ss"),
    version: "1.0",
    zimmetainfo: JSON.stringify(zimmetainfo)
  };
};

/**
 * 生成支付参数供客户端使用
 * @param {Object} opts
 * @param {String} opts.subject              商品的标题/交易标题/订单标题/订单关键字等
 * @param {String} [opts.body]               对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body
 * @param {String} opts.outTradeId           商户网站唯一订单号
 * @param {String} [opts.timeout]            设置未付款支付宝交易的超时时间，一旦超时，该笔交易就会自动被关闭。
 当用户进入支付宝收银台页面（不包括登录页面），会触发即刻创建支付宝交易，此时开始计时。
 取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。
 该参数数值不接受小数点， 如 1.5h，可转换为 90m。
 * @param {String} opts.amount               订单总金额，单位为元，精确到小数点后两位，取值范围[0.01,100000000]
 * @param {String} [opts.sellerId]           收款支付宝用户ID。 如果该值为空，则默认为商户签约账号对应的支付宝用户ID
 * @param {String} opts.goodsType            商品主类型：0—虚拟类商品，1—实物类商品 注：虚拟类商品不支持使用花呗渠道
 * @param {String} [opts.passbackParams]     公用回传参数，如果请求时传递了该参数，则返回给商户时会回传该参数。支付宝会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
 * @param {String} [opts.promoParams]        优惠参数(仅与支付宝协商后可用)
 * @param {String} [opts.extendParams]       业务扩展参数 https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.3oJPAi&treeId=193&articleId=105465&docType=1#kzcs
 * @param {String} [opts.enablePayChannels]  可用渠道，用户只能在指定渠道范围内支付。当有多个渠道时用“,”分隔。注：与disable_pay_channels互斥
 * @param {String} [opts.disablePayChannels] 禁用渠道，用户不可用指定渠道支付。当有多个渠道时用“,”分隔。 注：与enable_pay_channels互斥
 * @param {String} [opts.storeId]            商户门店编号
 */
props.pay = function (opts) {

  var biz_content = {
    body: opts.body,
    subject: opts.subject,
    out_trade_no: opts.outTradeId,
    timeout_express: opts.timeout,
    total_amount: opts.amount,
    seller_id: opts.sellerId,
    product_code: "QUICK_MSECURITY_PAY",
    goods_type: opts.goodsType,
    passback_params: opts.passbackParams,
    promo_params: opts.promoParams,
    extend_params: opts.extendParams,
    enable_pay_channels: opts.enablePayChannels,
    disable_pay_channels: opts.disablePayChannels,
    store_id: opts.storeId
  };

  var params = this.makeParams("alipay.trade.wap.pay", biz_content);
  params.notify_url = this.notifyUrl;
  params.return_url = opts.return_url;

  return utl.processParams(params, this.rsaPrivate, this.signType);
};

/**
 * 生成支付参数供web端使用
 * @param {Object} opts
 * @param {String} opts.subject              商品的标题/交易标题/订单标题/订单关键字等
 * @param {String} [opts.body]               对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body
 * @param {String} opts.outTradeId           商户网站唯一订单号
 * @param {String} [opts.timeout]            设置未付款支付宝交易的超时时间，一旦超时，该笔交易就会自动被关闭。
 当用户进入支付宝收银台页面（不包括登录页面），会触发即刻创建支付宝交易，此时开始计时。
 取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。
 该参数数值不接受小数点， 如 1.5h，可转换为 90m。
 * @param {String} opts.amount               订单总金额，单位为元，精确到小数点后两位，取值范围[0.01,100000000]
 * @param {String} [opts.sellerId]           收款支付宝用户ID。 如果该值为空，则默认为商户签约账号对应的支付宝用户ID
 * @param {String} opts.goodsType            商品主类型：0—虚拟类商品，1—实物类商品 注：虚拟类商品不支持使用花呗渠道
 * @param {String} [opts.passbackParams]     公用回传参数，如果请求时传递了该参数，则返回给商户时会回传该参数。支付宝会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
 * @param {String} [opts.promoParams]        优惠参数(仅与支付宝协商后可用)
 * @param {String} [opts.extendParams]       业务扩展参数 https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.3oJPAi&treeId=193&articleId=105465&docType=1#kzcs
 * @param {String} [opts.enablePayChannels]  可用渠道，用户只能在指定渠道范围内支付。当有多个渠道时用“,”分隔。注：与disable_pay_channels互斥
 * @param {String} [opts.disablePayChannels] 禁用渠道，用户不可用指定渠道支付。当有多个渠道时用“,”分隔。 注：与enable_pay_channels互斥
 * @param {String} [opts.storeId]            商户门店编号
 * @param {String} [opts.return_url]         客户端回调地址，HTTP/HTTPS开头字符串
 */
props.webPay = function (opts) {

  var biz_content = {
    body: opts.body,
    subject: opts.subject,
    out_trade_no: opts.outTradeId,
    timeout_express: opts.timeout,
    total_amount: opts.amount,
    seller_id: opts.sellerId,
    product_code: "FAST_INSTANT_TRADE_PAY",
    goods_type: opts.goodsType,
    passback_params: opts.passbackParams,
    promo_params: opts.promoParams,
    extend_params: opts.extendParams,
    enable_pay_channels: opts.enablePayChannels,
    disable_pay_channels: opts.disablePayChannels,
    store_id: opts.storeId,
    return_url: opts.return_url
  };

  var params = this.makeParams("alipay.trade.page.pay", biz_content);
  params.notify_url = this.notifyUrl;
  params.return_url = opts.return_url;

  return utl.processParams(params, this.rsaPrivate, this.signType);
};
/**
 * 生成支付参数供当面付二维码使用
 * @param {Object} opts
 * @param {String} opts.outTradeId           商户网站唯一订单号
 * @param {String} opts.subject              商品的标题/交易标题/订单标题/订单关键字等
 * @param {String} opts.amount               订单总金额，单位为元，精确到小数点后两位，取值范围[0.01,100000000]
 * @param {String} [opts.body]               对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body
 * @param {String} [opts.timeout]            设置未付款支付宝交易的超时时间，一旦超时，该笔交易就会自动被关闭。
 *                                           当用户进入支付宝收银台页面（不包括登录页面），会触发即刻创建支付宝交易，此时开始计时。
 *                                           取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。
 *                                           该参数数值不接受小数点， 如 1.5h，可转换为 90m。
 * @param {String} [opts.goodsDetail]        订单包含的商品列表信息，JSON格式，例如：{"show_url":"https://example/good/id"}
 * @param {String} [opts.extendParams]       业务扩展参数 https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.3oJPAi&treeId=193&articleId=105465&docType=1#kzcs
 * @param {String} [opts.enablePayChannels]  可用渠道，用户只能在指定渠道范围内支付。当有多个渠道时用“,”分隔。注：与disable_pay_channels互斥
 * @param {String} [opts.disablePayChannels] 禁用渠道，用户不可用指定渠道支付。当有多个渠道时用“,”分隔。 注：与enable_pay_channels互斥
 */
props.preCreate = function (opts) {
  var biz_content = {
    out_trade_no: opts.outTradeId,
    subject: opts.subject,
    total_amount: opts.amount,
    body: opts.body,
    timeout_express: opts.timeout,
    goods_detail: opts.goodsDetail,
    extend_params: opts.extendParams,
    enable_pay_channels: opts.enablePayChannels,
    disable_pay_channels: opts.disablePayChannels
  };

  var params = this.makeParams("alipay.trade.precreate", biz_content);
  params.notify_url = this.notifyUrl;
  params.return_url = opts.return_url;
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + utl.processParams(params, this.rsaPrivate, this.signType)
  });
};
/**
 * 生成支付参数供当面付条码使用
 * @param {Object} opts
 * @param {String} opts.outTradeId           商户网站唯一订单号
 * @param {String} opts.subject              商品的标题/交易标题/订单标题/订单关键字等
 * @param {String} opts.amount               订单总金额，单位为元，精确到小数点后两位，取值范围[0.01,100000000]
 * @param {String} [opts.body]               对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body
 * @param {String} [opts.timeout]            设置未付款支付宝交易的超时时间，一旦超时，该笔交易就会自动被关闭。
 *                                           当用户进入支付宝收银台页面（不包括登录页面），会触发即刻创建支付宝交易，此时开始计时。
 *                                           取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。
 *                                           该参数数值不接受小数点， 如 1.5h，可转换为 90m。
 * @param {String} [opts.goodsDetail]        订单包含的商品列表信息，JSON格式，例如：{"show_url":"https://example/good/id"}
 * @param {String} [opts.extendParams]       业务扩展参数 https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.3oJPAi&treeId=193&articleId=105465&docType=1#kzcs
 * @param {String} [opts.enablePayChannels]  可用渠道，用户只能在指定渠道范围内支付。当有多个渠道时用“,”分隔。注：与disable_pay_channels互斥
 * @param {String} [opts.disablePayChannels] 禁用渠道，用户不可用指定渠道支付。当有多个渠道时用“,”分隔。 注：与enable_pay_channels互斥
 */
props.qrCreate = function (opts) {
  var biz_content = {
    out_trade_no: opts.outTradeId,
    subject: opts.subject,
    total_amount: opts.amount,
    body: opts.body,
    scene: opts.scene,
    auth_code: opts.authCode,
    timeout_express: opts.timeout,
    goods_detail: opts.goodsDetail,
    extend_params: opts.extendParams,
    enable_pay_channels: opts.enablePayChannels,
    disable_pay_channels: opts.disablePayChannels
  };

  var params = this.makeParams("alipay.trade.pay", biz_content);
  params.notify_url = this.notifyUrl;
  params.return_url = opts.return_url;
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + utl.processParams(params, this.rsaPrivate, this.signType)
  });
};
/**
 * 生成参数供人脸初始化使用
 * @param {Object} opts
 * @param {String} opts.apdidToken           设备指纹
 * @param {String} opts.appName              应用名称
 * @param {String} opts.appVersion           应用版本
 * @param {String} opts.bioMetaInfo          生物信息如2.3.0:3,-4
 */
props.smileInit = function (opts) {
  var params = this.makeParams("alipay.trade.pay", opts);
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + utl.processParams(params, this.rsaPrivate, this.signType)
  });
};
/**
 * 生成参数供刷脸初始化使用
 * @param {Object} opts
 * @param {String} opts.apdid_token              设备指纹，用于唯一标识一台设备
 */
props.appPay = function (opts) {

  var biz_content = {};

  var params = this.makeParams("zoloz.authentication.smilepay.initialize", biz_content);
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + utl.processParams(params, this.rsaPrivate, this.signType)
  });
};
/**
 * 生成支付参数供App端使用
 * @param {Object} opts
 * @param {String} opts.subject              商品的标题/交易标题/订单标题/订单关键字等
 * @param {String} [opts.body]               对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body
 * @param {String} opts.outTradeId           商户网站唯一订单号
 * @param {String} [opts.timeout]            设置未付款支付宝交易的超时时间，一旦超时，该笔交易就会自动被关闭。
 *                                           当用户进入支付宝收银台页面（不包括登录页面），会触发即刻创建支付宝交易，此时开始计时。
 *                                           取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。
 *                                           该参数数值不接受小数点， 如 1.5h，可转换为 90m。
 * @param {String} opts.amount               订单总金额，单位为元，精确到小数点后两位，取值范围[0.01,100000000]
 * @param {String} [opts.sellerId]           收款支付宝用户ID。 如果该值为空，则默认为商户签约账号对应的支付宝用户ID
 * @param {String} opts.goodsType            商品主类型：0—虚拟类商品，1—实物类商品 注：虚拟类商品不支持使用花呗渠道
 * @param {String} [opts.passbackParams]     公用回传参数，如果请求时传递了该参数，则返回给商户时会回传该参数。支付宝会在异步通知时将该参数原样返回。本参数必须进行UrlEncode之后才可以发送给支付宝
 * @param {String} [opts.promoParams]        优惠参数(仅与支付宝协商后可用)
 * @param {String} [opts.extendParams]       业务扩展参数 https://doc.open.alipay.com/docs/doc.htm?spm=a219a.7629140.0.0.3oJPAi&treeId=193&articleId=105465&docType=1#kzcs
 * @param {String} [opts.enablePayChannels]  可用渠道，用户只能在指定渠道范围内支付。当有多个渠道时用“,”分隔。注：与disable_pay_channels互斥
 * @param {String} [opts.disablePayChannels] 禁用渠道，用户不可用指定渠道支付。当有多个渠道时用“,”分隔。 注：与enable_pay_channels互斥
 * @param {String} [opts.storeId]            商户门店编号
 */
props.appPay = function (opts) {

  var biz_content = {
    body: opts.body,
    subject: opts.subject,
    out_trade_no: opts.outTradeId,
    timeout_express: opts.timeout,
    total_amount: opts.amount,
    seller_id: opts.sellerId,
    product_code: "QUICK_MSECURITY_PAY",
    goods_type: opts.goodsType,
    passback_params: opts.passbackParams,
    promo_params: opts.promoParams,
    extend_params: opts.extendParams,
    enable_pay_channels: opts.enablePayChannels,
    disable_pay_channels: opts.disablePayChannels,
    store_id: opts.storeId
  };

  var params = this.makeParams("alipay.trade.app.pay", biz_content);
  params.notify_url = this.notifyUrl;
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + utl.processParams(params, this.rsaPrivate, this.signType)
  });
};
/**
 * 刷脸设备入驻
 * @param {Object} opts
 * @param {String} opts.terminal_id              设备终端id,唯一
 * @param {String} opts.product_user_id          厂商支付宝账号
 * @param {String} opts.merchant_user_id         商户支付宝账号
 * @param {String} opts.machine_type             设备类型
 * @param {String} opts.machine_cooperation_type 合作类型
 * @param {Date}   opts.machine_delivery_date    出厂时间
 * @param {String} opts.machine_name             设备名称，厂商简称
 * @param {Object} opts.delivery_address         设备发货地址信息
 * @param {Number}             area_code         行政区代码-区
 * @param {String}       machine_address         售货机地址
 * @param {Number}         province_code         行政区代码-省
 * @param {Number}         city_code             行政区代码-市
 * @param {Object} opts.point_position           设备点位地址信息
 * @param {Number}             areaCode          行政区代码-区
 * @param {String}       machineAddress          售货机地址
 * @param {Number}         provinceCode          行政区代码-省
 * @param {Number}         cityCode              行政区代码-市
 * @param {String} opts.merchant_user_type       运营商类型
 * @param {Object} opts.scene                    售货机场景
 * @param {String} opts.scene.level_1            售货机场景
 * @param {String} opts.scene.level_2            售货机场景
 */
props.smileRegister = function (opts) {

  var params = this.makeParams("ant.merchant.expand.automat.apply.upload", opts);
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + utl.processParams(params, this.rsaPrivate, this.signType)
  });
};
/**
 * 刷脸设备入驻信息更改
 * @param {Object} opts
 * @param {String} opts.terminal_id              设备终端id,唯一
 * @param {String} opts.product_user_id          厂商支付宝账号
 * @param {String} opts.merchant_user_id         商户支付宝账号
 * @param {String} opts.machine_type             设备类型
 * @param {String} opts.machine_cooperation_type 合作类型
 * @param {Date}   opts.machine_delivery_date    出厂时间
 * @param {String} opts.machine_name             设备名称，厂商简称
 * @param {Object} opts.delivery_address         设备发货地址信息
 * @param {Number}             area_code         行政区代码-区
 * @param {String}       machine_address         售货机地址
 * @param {Number}         province_code         行政区代码-省
 * @param {Number}         city_code             行政区代码-市
 * @param {Object} opts.point_position           设备点位地址信息
 * @param {Number}             areaCode          行政区代码-区
 * @param {String}       machineAddress          售货机地址
 * @param {Number}         provinceCode          行政区代码-省
 * @param {Number}         cityCode              行政区代码-市
 * @param {String} opts.merchant_user_type       运营商类型
 * @param {Object} opts.scene                    售货机场景
 * @param {String} opts.scene.level_1            售货机场景
 * @param {String} opts.scene.level_2            售货机场景
 */
props.smileUpdate = function (opts) {

  var params = this.makeParams("ant.merchant.expand.automat.apply.modify", opts);
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + utl.processParams(params, this.rsaPrivate, this.signType)
  });
};
/**
 * 签名校验
 * @param {Object} response 支付宝的响应报文
 */
props.signVerify = function (response) {
  var ret = utl.copy(response);
  var sign = ret["sign"];
  ret.sign = undefined;
  ret.sign_type = undefined;

  var tmp = utl.encodeParams(ret);
  return utl.signVerify(tmp.unencode, sign, this.rsaPublic, this.signType);
};

/**
 * 查询交易状态 https://doc.open.alipay.com/doc2/apiDetail.htm?spm=a219a.7629065.0.0.PlTwKb&apiId=757&docType=4
 * @param {Object} opts
 * @param {String} [opts.outTradeId]    订单支付时传入的商户订单号,和支付宝交易号不能同时为空。 tradeId,outTradeId如果同时存在优先取tradeId
 * @param {String} [opts.tradeId]       支付宝交易号，和商户订单号不能同时为空
 * @param {String} [opts.appAuthToken]  https://doc.open.alipay.com/doc2/detail.htm?treeId=216&articleId=105193&docType=1
 */
props.query = function (opts) {

  var biz_content = {
    out_trade_no: opts.outTradeId,
    trade_no: opts.tradeId,
    query_options: ["TRADE_SETTLE_INFO"]
  };

  var params = this.makeParams("alipay.trade.query", biz_content);
  if (this.appAuthToken) {
    params.app_auth_token = this.appAuthToken;
  }

  var body = utl.processParams(params, this.rsaPrivate, this.signType);

  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + body
  });
};
/**
 * 查询刷脸付交易状态 https://doc.open.alipay.com/doc2/apiDetail.htm?spm=a219a.7629065.0.0.PlTwKb&apiId=757&docType=4
 * @param {Object} opts
 * @param {String} [opts.ftoken]         人脸token
 * @param {String} [opts.biz_type]       1、1：1人脸验证能力 2、1：n人脸搜索能力（支付宝uid入库）3、1：n人脸搜索能力（支付宝手机号入库） 4、手机号和人脸识别综合能力
 * @param {String} [opts.ext_info]       可选  人脸产品拓展参数
 */
props.queryfToken = function (opts) {

  var biz_content = {
    ftoken: opts.ftoken,
    biz_type: opts.bizType
  };
  var params = this.makeParams("zoloz.authentication.customer.ftoken.query", biz_content);
  var body = utl.processParams(params, this.rsaPrivate, this.signType);

  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + body
  });
};


/**
 * 统一收单交易关闭接口 https://doc.open.alipay.com/doc2/apiDetail.htm?spm=a219a.7629065.0.0.6VzMcn&apiId=1058&docType=4
 * @param {Object} opts
 * @param {String} [opts.outTradeId]    订单支付时传入的商户订单号,和支付宝交易号不能同时为空。 tradeId,outTradeId如果同时存在优先取tradeId
 * @param {String} [opts.tradeId]       支付宝交易号，和商户订单号不能同时为空
 * @param {String} [opts.operatorId]    卖家端自定义的的操作员 ID
 * @param {String} [opts.appAuthToken]  https://doc.open.alipay.com/doc2/detail.htm?treeId=216&articleId=105193&docType=1
 */
props.close = function (opts) {

  var biz_content = {
    out_trade_no: opts.outTradeId,
    trade_no: opts.tradeId,
    operator_id: opts.operatorId
  };

  var params = this.makeParams("alipay.trade.close", biz_content);
  if (this.appAuthToken) {
    params.app_auth_token = this.appAuthToken;
  }

  var body = utl.processParams(params, this.rsaPrivate, this.signType);

  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + body
  });
};


/**
 * 统一收单交易退款接口 https://doc.open.alipay.com/doc2/apiDetail.htm?spm=a219a.7629065.0.0.PlTwKb&apiId=759&docType=4
 * @param {Object} opts
 * @param {String} [opts.outTradeId]    订单支付时传入的商户订单号,和支付宝交易号不能同时为空。 tradeId,outTradeId如果同时存在优先取tradeId
 * @param {String} [opts.tradeId]       支付宝交易号，和商户订单号不能同时为空
 * @param {String} [opts.operatorId]    卖家端自定义的的操作员 ID
 * @param {String} [opts.appAuthToken]  https://doc.open.alipay.com/doc2/detail.htm?treeId=216&articleId=105193&docType=1
 * @param {String} opts.refundAmount    需要退款的金额，该金额不能大于订单金额,单位为元，支持两位小数
 * @param {String} [opts.refundReason]  退款的原因说明
 * @param {String} [opts.outRequestId]  标识一次退款请求，同一笔交易多次退款需要保证唯一，如需部分退款，则此参数必传。
 * @param {String} [opts.storeId]       商户的门店编号
 * @param {String} [opts.terminalId]    商户的终端编号
 */
props.refund = function (opts) {

  var biz_content = {
    out_trade_no: opts.outTradeId,
    trade_no: opts.tradeId,
    operator_id: opts.operatorId,
    refund_amount: opts.refundAmount,
    refund_reason: opts.refundReason,
    out_request_no: opts.outRequestId,
    store_id: opts.storeId,
    terminal_id: opts.terminalId
  };

  var params = this.makeParams("alipay.trade.refund", biz_content);
  if (this.appAuthToken) {
    params.app_auth_token = this.appAuthToken;
  }
  var body = utl.processParams(params, this.rsaPrivate, this.signType);
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + body
  });
};

/**
 * 统一收单交易结算（分账）接口 https://docs.open.alipay.com/api_1/alipay.trade.order.settle/
 * @param {Object} opts
 * @param {String} [opts.outRequestNo]     结算请求流水号 开发者自行生成并保证唯一性,必选
 * @param {String} [opts.tradeNo]          支付宝订单号，必选
 * @param {String} [opts.operatorId]       卖家端自定义的的操作员 ID
 * @param {String} [opts.appAuthToken]     https://doc.open.alipay.com/doc2/detail.htm?treeId=216&articleId=105193&docType=1
 * @param {String} opts.royalty_parameters 分账明细
 * @param {String} [opts.transOut]         分账支出方账户 2088101126765726
 * @param {String} [opts.transIn]          分账收入方账户 2088101126708402
 * @param {String} [opts.amount]           分账的金额，单位为元
 * @param {String} [opts.amountPercentage] 分账信息中分账百分比。取值范围为大于0，少于或等于100的整数。
 * @param {String} [opts.desc]             分账描述
 */
props.settle = function (opts) {
  const { operatorId, tradeNo, outRequestNo, transOut, transIn, amount, amountPercentage, desc } = opts;
  var biz_content = {
    operator_id: operatorId,
    trade_no: tradeNo,
    out_request_no: outRequestNo,
    royalty_parameters: [{
      trans_out: transOut,
      trans_in: transIn,
      amount: amount,
      amount_percentage: +opts.amountPercentage,
      desc: opts.desc
    }]
  };

  var params = this.makeParams("alipay.trade.order.settle", biz_content);
  if (this.appAuthToken)
    params.app_auth_token = this.appAuthToken;

  var body = utl.processParams(params, this.rsaPrivate, this.signType);
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + body
  });
};

/**
 * 分账关系绑定 接口 https://opendocs.alipay.com/apis/api_31/alipay.trade.royalty.relation.bind
 * @param {Object} opts
 * @param {String} [opts.outRequestNo]     绑定请求流水号 开发者自行生成并保证唯一性,必选
 * @param {String} [opts.account]          支付宝账号
 */
props.bind = function (opts) {
  const { account } = opts;
  var biz_content = {
    receiver_list: [{ type: 'loginName', account, name: account, memo: "售货机机主" }],
    out_request_no: Date.now(),
  };

  var params = this.makeParams("alipay.trade.royalty.relation.bind", biz_content);
  if (this.appAuthToken) params.app_auth_token = this.appAuthToken;
  var body = utl.processParams(params, this.rsaPrivate, this.signType);
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + body
  });
};

/**
 * 统一收单交易退款查询 https://doc.open.alipay.com/doc2/apiDetail.htm?docType=4&apiId=1049
 * @param {Object} opts
 * @param {String} [opts.outTradeId]    订单支付时传入的商户订单号,和支付宝交易号不能同时为空。 tradeId,outTradeId如果同时存在优先取tradeId
 * @param {String} [opts.tradeId]       支付宝交易号，和商户订单号不能同时为空
 * @param {String} [opts.outRequestId]  请求退款接口时，传入的退款请求号，如果在退款请求时未传入，则该值为创建交易时的外部交易号
 * @param {String} [opts.appAuthToken]  https://doc.open.alipay.com/doc2/detail.htm?treeId=216&articleId=105193&docType=1
 */
props.refundQuery = function (opts) {

  var biz_content = {
    out_trade_no: opts.outTradeId,
    trade_no: opts.tradeId,
    out_request_no: opts.outRequestId || opts.outTradeId
  };

  var params = this.makeParams("alipay.trade.fastpay.refund.query", biz_content);
  if (this.appAuthToken) {
    params.app_auth_token = this.appAuthToken;
  }

  var body = utl.processParams(params, this.rsaPrivate, this.signType);

  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + body
  });
};


/**
 * 查询对账单下载地址 https://doc.open.alipay.com/doc2/apiDetail.htm?spm=a219a.7629065.0.0.iX5mPA&apiId=1054&docType=4
 * @param {Object} opts
 * @param {String} [opts.billType]     账单类型，商户通过接口或商户经开放平台授权后其所属服务商通过接口可以获取以下账单类型：
 trade、signcustomer；trade指商户基于支付宝交易收单的业务账单；signcustomer是指基于商户支付宝余额收入及支出等资金变动的帐务账单；
 * @param {String} [opts.billDate]     账单时间：日账单格式为yyyy-MM-dd，月账单格式为yyyy-MM。
 * @param {String} [opts.appAuthToken]  https://doc.open.alipay.com/doc2/detail.htm?treeId=216&articleId=105193&docType=1
 */
props.billDownloadUrlQuery = function (opts) {

  var biz_content = {
    bill_type: opts.billType,
    bill_date: opts.billDate
  };

  var params = this.makeParams("alipay.data.dataservice.bill.downloadurl.query", biz_content);
  if (this.appAuthToken) {
    params.app_auth_token = this.appAuthToken;
  }

  var body = utl.processParams(params, this.rsaPrivate, this.signType);
  return utl.request({
    method: "GET",
    url: (this.sandbox ? alipay_gate_way_sandbox : alipay_gate_way) + "?" + body
  });
};
module.exports = Alipay;