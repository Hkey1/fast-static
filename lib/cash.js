/*
* Файловая вистема с кешированием.
* Кроме обычных файлов может хранить:
*    - виртуальные -- их нет на диске, только в памяти.
*    - ссылка -- ссылка на файл или файлы
* */
var fs     = require('fs');
var zlib   = require('zlib');
var crypto = require('crypto');
var mime = require('mime');

module.exports={
    addFile:function(fn,data){
        this.cash[fn]={data:data};
    },
    addLink:function(from,to,separator){
        this.cash[from]={
            link:to,
            separator:separator||'\n'
        };
    },
    dropFile:function(fn){
        delete this.cash[fn];
    },
    dropCash:function(){
        for(var fn in this.cash) if(this.cash.hasOwnProperty(fn)){
            if(this.cash[fn].data || this.cash[fn].link) {
                this.cash[fn].cashed=false;
                delete this.cash[fn].maked;
                delete this.cash[fn].gzip;
            } else
                delete this.cash[fn];
        }
    },
    dirname:function(fn){
        return fn.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
    },
    isGlobalFile:function(fn){
        return fn.indexOf('http://')===0||fn.indexOf('https://')===0||fn.indexOf('//')===0;
    },
    makeFiles:function(files,cb){
        if(!files.length) {
            this.cb(cb,false, []);
            return;
        }
        var self=this;
        var out=[];
        var finished=0;
        var err=false;
        for(var i=0;i<files.length;i++){
            out.push(0);
            self.makeFile(files[i],i,function(_err,entry,marker){
                out[marker]=entry;
                err=_err||err;
                finished++;
                if(files.length===finished)
                    self.cb(cb,err, out);
            });
        }
    },
    isHidden:function(fn){
        return (/(^|.\/)\.+[^\/\.]/g).test(fn);
    },
    makeFile:function(fn,marker,cb){
        var self=this;
        if(typeof(marker)=='function'){
            cb=marker;
            marker=false;
        }
        var entry;//  cash entry
        if(self.options.cash) {
            if(!self.cash[fn])
                self.cash[fn] = {};
            entry=self.cash[fn];
        }
        else{//if cash is disabled then we nead to create cash entry immitation
            var cash=self.cash[fn]||{};
            entry={
                group:   cash.group,
                virtual: cash.virtual,
                data:    cash.data
            };
        }
        if(typeof(entry.hidden)=='undefined')
            entry.hidden=this.isHidden(fn);

        if(entry.cashed)// we have cashed results
            this.cb(cb,false,entry,marker);
        else self.getFile(fn,function(err,data,stats){
            if(!err) {
                entry.stats = stats;
                entry.isDir = stats.isDirectory && stats.isDirectory();
            }
            if(err)
                self.cb(cb,err,entry,marker);
            else self.applyFilters(fn,data,function(err,data,ext){
                if(err){
                    self.cb(cb,err,entry,marker);
                    return;
                }
                err.sub=true;
                entry.cashed  = true;
                entry.maked   = data;
                entry.ext     = ext;
                entry.mime    = mime.lookup(ext);
                entry.charset = self.isTextFile(ext) ? 'UTF-8' : false;
                entry.contentType=entry.mime+(entry.charset ? '; charset=' + entry.charset : '');
                entry.hash   = self.hash(data);
                entry.etag   = '"'+entry.hash+'"';
                if(entry.maked instanceof Buffer)
                    entry.makedLen=entry.maked.length;
                else if(entry.charset)
                    entry.makedLen=Buffer.byteLength(entry.maked,'utf8');
                else
                    entry.makedLen=Buffer.byteLength(entry.maked);

                zlib.gzip(data,function(err,gzip){
                    if(err)
                        self.cb(cb,err,entry,marker);
                    else {
                        entry.gzip = gzip;
                        entry.gzipLen = gzip.length;
                        self.cb(cb,err,entry,marker);
                    }
                });
            });
        });
    },

    isTextFile:function(ext){
        if(ext.indexOf('.')!==-1)
            ext=this.getFileExt(ext);
        if(this.textExt[ext])
            return true;
        var type=mime.lookup(ext);
        if(this.textTypes[type]||mime.charsets.lookup(type))
            return true;
        var ext2=this.getFinalExt(ext);
        if(ext2!==ext)
            return this.isTextFile(ext2);
        else
            return false;
    },
    getFiles:function(files,baseFn,cb){
        var self=this;
        if(typeof(baseFn)=='function'){
            cb=baseFn;
            baseFn=false;
        }
        if(!files.length)
            this.cb(cb,false,[]);
        var out=[];
        var err=false;
        var finished=0;
        for(var i=0;i<files.length;i++){
            out.push('');
            self.getFile(files[i],i,baseFn,function(_err,_data,_stats,_marker){
                if(_err) {
                    _err.sub = true;
                    err = _err;
                }
                out[_marker]=_data;
                finished++;
                if(files.length===finished)
                    self.cb(cb,err, out);
            });
        }
    },
    getFile:function(fn,marker,baseFn,cb){
        var self=this;
        if(typeof(marker)=='function'){
            cb=marker;
            marker=false;
            baseFn=false;
        }
        if(typeof(baseFn)=='function'){
            cb=baseFn;
            baseFn=false;
        }
        if(!baseFn)
            baseFn=fn;

        var entry=self.cash[fn]||{};

        if(entry.data)
            this.cb(cb,err,entry.data,{},marker);
        else if(entry.link){
            var links= typeof(entry.link)=='string' ? [entry.link] : entry.link;
            self.getFiles(links,baseFn,function(err,out){
                if(!err)
                    out=out.join(entry.separator);
                self.cb(cb,err, out, {}, marker);
            });
        }
        else{
            if(!this.cash[fn] && this.notFoundCash[fn]) {
                this.cb(cb,this.clone(this.notFoundCash[fn]));
            }
            else fs.stat(fn,function(err,stats){
                if(err) {
                    if(typeof(err)=='object' && self.notFoundCodes[err.code] && self.options.cash) {
                        self.notFoundCash[fn] = self.clone(err);
                        self.notFoundCashSize++;
                        if(self.notFoundCashSize>10000)
                            self.notFoundCash={};
                    }
                    self.cb(cb,err);
                }
                else {
                    function readFile(fn,cb){
                        if(self.isTextFile(fn))
                            fs.readFile(fn,'utf8',cb);
                        else
                            fs.readFile(fn,cb);
                    }
                    readFile(fn,function(err,data){
                        if(err)
                            self.cb(cb,err);
                        else self.convert(fn, baseFn, data,function(err,data) {
                            self.cb(cb,err, data, stats, marker);
                        });
                    });
                }
            });
        }
    },
    hash:function(str){
        return crypto.createHash('md5').update(str).digest('hex');
    },
    joinPathes:function(dir,path){
        if(this.isGlobalFile(path) ||(path.length>=2 && path[0]==='.' && path[1]==='/'))
            return path;

        dir=dir.split('/');
        if(dir[dir.length-1]!=='' && dir[dir.length-1].indexOf('.')!==-1)
            dir[dir.length-1]='';
        dir=dir.join('/');

        if(dir===''||dir==='/')
            return path;

        if(dir[dir.length-1]==='/')
            dir=dir.substr(0,dir.length-1);

        dir=dir.split('/');
        path=path.split('/');
        while(path[0]==='..'){
            if(dir.length){
                dir=dir.slice(0,dir.length-1);
                path=path.slice(1,path.length);
            }
        }
        path=path.join('/');
        dir=dir.join('/');
        if(path!=='' && dir!=='' && dir[dir.length-1]==='/' && path[0]==='/')
            path=dir+path.substr(1);
        else if(dir!=='' && dir[dir.length-1]!=='/' && path!=='' && path[0]!=='/')
            path=dir+'/'+path;
        else
            path=dir+path;
        return path;
    },
    clone:function(obj, patch){
        if(typeof(obj)!='object'||obj===null||obj instanceof Array)
            return obj;
        var out={};
        if(obj.prototype)
            out.prototype=obj.prototype;
        var i;
        for(i in obj) if(obj.hasOwnProperty(i))
            out[i]=obj[i];
        if(patch) for(i in patch) if(patch.hasOwnProperty(i))
            out[i]=patch[i];
        return out;
    },
    convert:function(fn,baseFn,data,cb){//convert data to ext of baseFn file
        var self=this;
        this.applyFilters(fn,data,this.getFileExt(baseFn),function(err, data, ext){
            if(err){
                self.cb(cb,err);
                return;
            }
            self.cb(cb,err,self.convertPathes(fn,baseFn,data,ext));
        });
    },
    convertPathes:function(fn,baseFn,data,ext){
        var self=this;
        if(ext==='css') {
            data = data.replace(/url\(["']?(\S*)["']?\)/g, function (match, file) {
                file=file.trim();
                if (file.indexOf('data:') === 0 || self.isGlobalFile(file))
                    return match;
                file = self.convertPath(fn,baseFn,file);
                return 'url('+file+')';
            });
        }
        return data;
    },
    convertPath:function(fn,baseFn,path){
        var to   = baseFn;
        var from = this.joinPathes(fn,path);

        if(to!=='' && to[to.length-1]!=='/')
           to=this.dirname(to);

        from=from.split('/');
        to=to.split('/');

        var pathes={'':  to.length};
        var i;
        for(i=0;i<to.length+1;i++)
            pathes[to.slice(0,i).join('/')]=i;

        var res='';

        for(i=from.length;i>=0;i--) {
            var cur=from.slice(0,i).join('/');
            if(typeof(pathes[cur])!='undefined'){
                res='';
                for(var j=0;j<to.length-pathes[cur];j++)
                    res+='../';
                res+=from.slice(i).join('/');
                break;
            }
        }
        return res;
    }
};