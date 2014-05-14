/*
    TODO: разобраться с keep-alive
    modules
        haml
        jade
        less
        clean-css
        html-minifier
        uglify-js
        node-sass
        mime
        coffee-script
*/

var i;
var URL  = require('url');

//var FastStatic=module.exports;
exports.use=function(root, options){
    var self=this;
    var same=false;
    if(this.__root){
        same=(this.__root===root);
        if(same && options!==self.__options){
            if(!options || !self.__options)
                same=false;
            else{
                var i;
                for(i in options) if(options.hasOwnProperty(i))
                    if(options[i]!==self.__options[i])
                        same=false;
                for(i in self.__options) if(self.__options.hasOwnProperty(i))
                    if(options[i]!==self.__options[i])
                        same=false;
            }
        }
    }
    if(!same)
        self=this.init(root, options);
    return function(req,res,next){self.middleware(req,res,next)};
};
exports.cb=function(cb,p1,p2,p3,p4,p5,p6,p7,p8,p9){
    try{cb(p1,p2,p3,p4,p5,p6,p7,p8,p9);}
    catch(err){
        //console.error(err);
        console.error(err.stack);
        console.log(JSON.stringify(err));
    }
};
exports.init=function(root, options){
    if(this.__wasInit) {
        var inst=this.clone(this);
        this.__next=inst;
        inst.__prev=this;
        inst.__wasInit=false;
        return inst.init(root, options);
    }
    this.__wasInit=true;
    this.__root=root;
    this.__options=this.clone(options);

    if (!root) throw new Error('fastStatic root path required');
    options=options||{};
    options.root=root;
    if(!options.env)
        options.env=(process.env.NODE_ENV==='production') ? 'production' : 'development';
    options.index      = options.index  || 'index.html';
    options.maxAge     = options.maxAge || 0;
    options.hidden     = options.hidden || false;
    options.redirect   = options.redirect!==false;//||true
    options.gzip       = options.gzip!==false;//||true

    options.dateHeader = options.dateHeader||false;


    this.startTime=(new Date).getTime();

    var preset=this.presets[options.env];
    for(i in preset) if(preset.hasOwnProperty(i)) {
        if (typeof(options[i]) == 'undefined')
            options[i]=preset[i];
    }
    for(i in preset.filters) if(preset.filters.hasOwnProperty(i)) {
        if (typeof(options.filters[i]) == 'undefined')
            options.filters[i]=preset.filters[i];
    }

    this.filters=[];
    this.cash={};
    this.notFoundCash={};
    this.notFoundCashSize=0;
    this.options=options;
    this.initFilters();

    return this;
};
exports.middleware=function(req, res, next) {
    if(req.method!='GET' && req.method!='HEAD')
        return next();
    var url=URL.parse(req.url);
    var path = url.pathname;
    if (path[path.length - 1] === '/')
        path+=this.options.index;
    this.answer(req,res,this.joinPathes(this.options.root,path),this.options, next, url);
};
exports.answer=function(req,res,path,options, next, url){
    this.host=req.headers.host;

    var self=this;

    options=options||this.options;
    url=url||URL.parse(req.url);

    self.makeFile(path,function(err,entry)
    {
        next=next||function(_err){
            res.statusCode = _err ? 500 : 404;
            res.end(err);
        };
        if(err){
            if(typeof(err)=='object' && self.notFoundCodes[err.code] && !err.sub)
                next();// IF file not exists
            else
                next(err);
        }
        else if(entry.hidden && !options.hidden)
            next();
        else if(options.redirect && entry.isDir){
            url.pathname += '/';
            res.statusCode = 303;
            res.setHeader('Location',  URL.format(url));
            res.end();
        }
        else {
            res.setHeader('ETag', entry.etag);
            if(self.options.dateHeader)
                res.setHeader('Date', new Date().toUTCString());

            self.hash(entry.maked);
            res.setHeader('Cache-Control', 'public, max-age=' + options.maxAge / 1000);

            var modified=true;
            if(req.headers.hasOwnProperty('if-none-match'))
                modified=(req.headers['if-none-match'].indexOf(entry.etag)===-1);

            res.statusCode=modified ? 200 : 304;
            var gzip=options.gzip && entry.makedLen-entry.gzipLen>100 && (req.headers['accept-encoding'] ? req.headers['accept-encoding'].match(/\bgzip\b/) : false);

            var field=  gzip ? 'gzip' : 'maked';
            if(gzip)
                res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Length', entry[field+'Len']);
            res.setHeader('Content-Type', entry.contentType);

            if (req.method == 'HEAD'|| !modified)
                res.end();
            else if(entry.charset && !gzip)
                res.end(entry[field]);
            else
                res.end(entry[field],'binary');
        }
    });
};
exports.notFoundCodes = {'ENOENT':1, 'ENAMETOOLONG':1, 'ENOTDIR':1};
exports.textExt={
    js:true,
    ccs:true,
    html:true,
    htm:true,
    txt:true,
    jade:true,
    haml:true,
    sass:true,
    less:true,
    xml:true,
    xhtml:true,
    json:true
};
exports.textTypes={
    'application/xml':true,
    'application/xhtml+xml':true,
    'application/rss+xml':true,
    'application/javascript':true,
    'application/x-javascript':true,
    'application/json':true
};

exports.presets={
    development:{
        cash:false,
        filters:{
            'use':{joinFiles:false},
            'less':{},
            'sass':{},
            'jade':{},
            'haml':{},
            'coffee':{}
        }
    },
    production:{
        //cash:true,
        filters:{
            'use':{joinFiles:true},
            'less':{},
            'sass':{},
            'jade':{},
            'haml':{},
            'coffee':{},
            'min.css':{},
            'min.html':{},
            'min.js':{},
            'inline.img.css':{}
        }
    }
};

var filters = require('./filters.js');
for(i in filters) if(filters.hasOwnProperty(i))
    exports[i]=filters[i];

var cash = require('./cash.js');
for(i in cash) if(cash.hasOwnProperty(i))
    exports[i]=cash[i];