const http = require('http')
const https = require('https')
const URL = require('url')

function isobject(o){
    return typeof o === 'object' && o !== null
}
function isstring(o){
    return typeof o === 'string'
}

// warning
function warn(message){
    console.log('\x1B[33m'+message+'\x1b[39m')
}

function getProtocol(url){
    return URL.parse(url).protocol
}

function handle_params(opt){
    var args = Array.from(arguments)
    var _url = null, 
    _options = {}, 
    _headers = {}, 
    _data = null,
    _protocol = null, 
    _method = 'get';
    // default
    const UserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15'
    if(isobject(opt)){
        _url = opt.url
        _options = opt.options || _options
        _headers = opt.headers || _headers
        _headers['User-Agent'] = _headers['User-Agent'] ? _headers['User-Agent'] : UserAgent
        _data = JSON.stringify(opt.data)
        if(_data){
            // 说明是post请求
            _headers['Content-Type'] = 'application/x-www-form-urlencoded'
            _headers['Content-Length'] = Buffer.byteLength(_data)
        }
        _options.headers = _headers
        _protocol = getProtocol(_url)
        _method = opt.method || _method
    }
    if(isstring(opt)){
        _url = opt
        _method = args[1] || _method
        _options = args[2] || _options
        _protocol = getProtocol(_url)
    }
    var params = {
        _url,
        _options,
        _protocol,
        _method,
        _data
    }
    return params
}

function isapplication(_response){
    var content_type = _response.headers['content-type']
    var apptype = content_type.split(';')[0]
    return /^application/g.test(apptype)
}

function handle_post_data(obj){
    var strings = ''
    if(isobject(obj)){
        for(let o in obj){
            strings = strings + o + '=' + obj[o] + '&'
        }
        return strings.replace('/&$/g', '')
    }
    warn('is not a object')
}

function isNotMuch(_response){
    var content_length = +_response.headers['content-length']
    if(content_length <= 10000){
        // 如果数据量小于10000，说明数据量不多
        return true
    }
    return false
}

function handle_response_json(_response){
    var content_type = _response.headers['content-type']
    if(!content_type){
        return
    }
    var apptype = content_type.split(';')[0]
    if(apptype === 'application/json'){
        // 说明是json数据
        _response.json = JSON.parse(_response.text)
    }
    return _response
}

function handle_response(response){
    return new Promise(function(__resolve, __reject){
        var chunks = []
        var _response = response
        if(isNotMuch(response)){
            // 说明是文件内容
            response.on('data', function(chunk){
                chunks.push(chunk)
            })
            response.on('error', function(error){
                __reject(error)
            })
            response.on('end', function(){
                var buf = Buffer.concat(chunks)
                _response.buffer = buf
                _response.text = buf.toString()
                _response = handle_response_json(_response)
                __resolve(_response)
            })
        }else{
            __resolve(_response)
        }
    })
}

function reero(opt){
    return new Promise(function(__resolve, __reject){
        var { _url, _method, _options, _protocol, _data } = handle_params(opt)
        if(_protocol === 'http:'){
            // 说明是http协议
            if(_method.toUpperCase() === 'GET'){
                // 说明是get请求
                http.get(_url, _options, function(response){
                    handle_response(response).then(response=>{
                        __resolve(response)
                    })
                })
            }
            if(_method.toUpperCase() === 'POST'){
                http.request(_url, {
                    method: 'POST',
                    ..._options
                }, function(response){
                    handle_response(response).then(response=>{
                        __resolve(response)
                    })
                }).write(_data)
            }
        }
        if(_protocol === 'https:'){
            // 说明是https协议
            if(_method.toUpperCase() === 'GET'){
                // 说明是get请求
                https.get(_url, _options, function(response){
                    handle_response(response).then(response=>{
                        __resolve(response)
                    })
                })
            }
            if(_method.toUpperCase() === 'POST'){
                https.request(_url, {
                    method: 'POST',
                    ..._options
                }, function(response){
                    handle_response(response).then(response=>{
                        __resolve(response)
                    })
                }).write(_data)
            }
        }
    })
}

module.exports = reero