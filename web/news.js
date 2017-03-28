var http = require('http');
var parseUrl = require('url').parse;

var news = {1:'Firstly',2:'Secondly',3:'Thirdly'};

function getNews(id){
    return news[id]||'文章不存在';     
}
var server = http.createServer(function (req,res){
    function send(html) {
        res.writeHead(200,{
            'content-type':'text/html;charset=utf-8'
        });     //response.writeHead包含两个参数，第一个200为状态码，第二个为响应头，Content-Type：服务器通过这个头，告诉浏览器回送数据的类型
        res.end(html);      //结束函数调用返回html
    }

    var info = parseUrl(req.url,true);      //req.url的值如：news?type=1?id=1
    console.log(req.url);
    req.pathname = info.pathname;   //返回url中的pathname参数,
    req.query = info.query;    //返回url中的query参数
    if(req.url === '/'){
        send('<ul>'+
                '<li><a href="news?type=1&id=1">新闻壹</a></li>' +
                '<li><a href="news?type=1&id=2">新闻贰</a></li>' +
                '<li><a href="news?type=1&id=3">新闻叁</a></li>' +
            '</ul>');       //如果是根目录，返回网址主页
    }else if(req.pathname === '/news' && req.query.type === '1'){
        send(getNews(req.query.id));  //如果是news子目录，返回id值在NEWS对象中相对应的内容
    }else {
        send('<h1>文章不存在</h1>')    //如果不是根目录,返回“文章不存在”
    }
})

server.listen(3001);