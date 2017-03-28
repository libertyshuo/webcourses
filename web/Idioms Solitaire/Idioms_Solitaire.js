var PORT = require('./lib/config').wxPort;      

var http = require('http');
var qs = require('qs');
var TOKEN = 'libertyshuo';

var getUserInfo = require('./lib/user').getUserInfo;  //调用user获得用户基本信息
var replyText = require('./lib/reply').replyText;       

var wss = require('./lib/ws.js').wss;

function checkSignature(params, token){
  //1. 将token、timestamp、nonce三个参数进行字典序排序
  //2. 将三个参数字符串拼接成一个字符串进行sha1加密
  //3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信

  var key = [token, params.timestamp, params.nonce].sort().join('');
  var sha1 = require('crypto').createHash('sha1');
  sha1.update(key);
  
  return  sha1.digest('hex') == params.signature;
}

var server = http.createServer(function (request, response) {

  //解析URL中的query部分，用qs模块(npm install qs)将query解析成json
  var query = require('url').parse(request.url).query;
  var params = qs.parse(query);

  if(!checkSignature(params, TOKEN)){
    //如果签名不对，结束请求并返回
    response.end('signature fail');
    return;
  }

  if(request.method == "GET"){
    //如果请求是GET，返回echostr用于通过服务器有效校验
    response.end(params.echostr);
  }else{
    //否则是微信给开发者服务器的POST请求
    var postdata = "";

    request.addListener("data",function(postchunk){     //req.addListener实现对事件的侦听
        postdata += postchunk;              //获取到了POST数据
    });
    request.addListener("end",function(){
      var parseString = require('xml2js').parseString;      //用到nodejs模块xml2js解析xml

      parseString(postdata, function (err, result) {
        if(!err){
          if(result.xml.MsgType[0] === 'text'){     //判断xml中MsgType参数是否(类型与值)等于text
            getUserInfo(result.xml.FromUserName[0])
            .then(function(userInfo){
              var len = result.xml.Content[0].lenth;        //将用户输入的内容长度赋值给len
              if(result.xml.Content[0].length == 4){    //如果内容长度为4则在map对象中找能够对应的成语
              var mapObj = new Map([['一','一心一意'],["胸","胸有成竹"],["竹","竹报平安"],["安","安富尊荣"],["荣","荣华富贵"],["贵","贵而贱目"],["目","目无余子"],["子","子虚乌有"],["有","有目共睹"],["睹","睹物思人"],["人","人中骐骥"],["骥","骥子龙文"],['取','取长补短'],['青','青山绿水'],['青','青山绿水'],['和','和风细雨'],['东','东山再起'],['不','不以为然'], ['千','千人一面'],['十','十指连心'],['取','取长补短'],['五','五花八门'], ['春','春风化雨'],['春','春风化雨'],['舍','舍己为人'],['意','意味深长'],['长','长话短说'],['说','说一不二'],['二','二龙戏珠'],['珠','珠光宝气'],['气','气象万千'],['千','千辛万苦'],['苦','苦口婆心'],['心','心平气和'],['和','和蔼可亲'],['亲','亲如手足']]);      
              var str = result.xml.Content[0].substr(3,1);   //将输入成语的最后一个字传给变量str
              if(mapObj.get(str)==null){         //如果map对象中没有成语对应，则用户胜利
                  var res = replyText(result, '好吧，你赢了。');
                  response.end(res);
              }else{
                  var res = replyText(result, mapObj.get(str));      //返回对应的成语
                  response.end(res);
                  }
          }else{            //如果用户输入内容不是四个字的成语，则返回给用户输入错误的信息
              var res = replyText(result, '请输入成语的正确格式！');
              response.end(res);
              }            
            })
          }
        }
      });
    });
  }
});
server.listen(PORT);