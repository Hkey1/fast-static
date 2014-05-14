var crypto = require('crypto');
exports.init=function(fs,options){
    options.tabLen=options.tabLen||4;
    var tab='';
    for (var i = 0; i < options.tabLen;i++)
        tab+=' ';

    return {
        exts:'html,htm',
        order:200,
        fun:function(data,filename, ext, cb) {
            var start = '#$g2cS#$#$';//some unic string
            var cssMarker = start + '.css' + '|';
            var jsMarker = start + '.js' + '|';
            var sort=function(a,b) {
                return (a.pos !== b.pos) ?  a.pos - b.pos : a.num - b.num;
            };
            makeFile(data, filename, filename, false, function(data,err,css,js){
                var i;
                if (options.joinFiles) {
                    var fn;
                    var css0=[]; //files to single insert
                    var js0=[];

                    var css2=[];//files to join
                    var js2=[];
                    for(i=0;i<css.length;i++){
                        if(fs.isGlobalFile(css[i]))
                            css0.push(css[i]);
                        else
                            css2.push(css[i]);
                    }
                    for(i=0;i<js.length;i++){
                        if(fs.isGlobalFile(js[i]))
                            js0.push(js[i]);
                        else
                            js2.push(js[i]);
                    }

                    if (css2.length) {
                        var cssfn = fs.hash(css2.join('\n')) + '.css';
                        fs.addLink(fs.joinPathes(fs.options.root,cssfn), css2, '\n');
                        css0.push(cssfn);
                    }
                    if (js2.length) {
                        var jsfn = fs.hash(css2.join('\n')) + '.js';
                        fs.addLink(fs.joinPathes(fs.options.root,jsfn), js2, '\n');
                        js0.push(jsfn);
                    }
                    js=js0;
                    css=css0;
                }
                var cssCode = '';
                var jsCode = '';
                for (i = 0; i < css.length; i++){
                    if(css[i].indexOf(fs.options.root)===0)
                        css[i]=css[i].substr(fs.options.root.length);
                    if(css[i][0]==='/')
                        css[i]=css[i].substr(1);
                    cssCode += '<link href="' + css[i] + '" rel="stylesheet" />\n';
                }
                for (i = 0; i < js.length; i++) {
                    if(js[i].indexOf(fs.options.root)===0)
                        js[i]=js[i].substr(fs.options.root.length);
                    if(js[i][0]==='/')
                        js[i]=js[i].substr(1);
                    jsCode += '<script src="' + js[i] + '" type="text/javascript"></script>\n';
                }
                cssCode='\n'+cssCode;
                jsCode='\n'+jsCode;

                if (data.split(cssMarker).length !== 1) {
                    data = data.replace(cssMarker, cssCode);
                    data = data.split(cssMarker).join('');
                } else
                    data = data.replace('</head>', cssCode + '</head>');

                if (data.split(jsMarker).length !== 1) {
                    data = data.replace(jsMarker, jsCode);
                    data = data.split(jsMarker).join('');
                } else
                    data = data.replace('</body>', jsCode + '</body>');
                cb(err, data);
            });
            function makeFile(data, filename, baseFn, marker, cb) {
                var err = false;
                var entries = [];
                data = data.replace(/\<use\>([\s\S]*)\<\/use\>/ig, function (match, code) {
                    code = code.trim();
                    var lc = code.toLowerCase();
                    if (lc === '.css')
                        return cssMarker;
                    if (lc === '.js')
                        return jsMarker;
                    entries.push(code);
                    return start + (entries.length - 1) + '|';
                });
                var finished = 0;
                var was = {};
                var css = [];
                var js = [];
                var i;
                for (i = 0; i < entries.length; i++) {
                    makeEntry(i, entries[i], filename, baseFn, function (_err, _i, _data, _css, _js) {
                        err = err || _err;
                        if(err){
                            err.message+=':: In USE tag in file '+filename;
                            cb('',err, [], [], marker);
                            return;
                        }
                        finished++;
                        data = data.replace(start + _i + '|', _data || '');

                        var j;
                        for (j = 0; j < _css.length; j++) {
                            if (!was[_css[j]]) {
                                was[_css[j]] = 1;
                                css.push({file:_css[j],pos:_i,num:j});
                            }
                        }
                        for (j = 0; j < _js.length; j++) {
                            if (!was[_js[j]]) {
                                was[_js[j]] = 1;
                                js.push({file:_js[j],pos:_i,num:j});
                            }
                        }
                        if (finished === entries.length) {
                            js=js.sort(sort);
                            css=css.sort(sort);

                            var css2=[];
                            var js2=[];

                            var k;
                            for(k=0;k<css.length;k++)
                                css2.push(css[k].file);
                            for(k=0;k<js.length;k++)
                                js2.push(js[k].file);
                            cb(data, err, css2, js2, marker);
                        }
                    });
                }
                if (entries.length === 0)
                    cb(data,err,css,js,marker);
            }
            function makeEntry(marker, code, filename, baseFn,cb) {
                code = code.split('[');
                var envIndex = fs.options.env === 'production' ? 1 : 0;
                for (var l = 0; l < code.length; l++) {
                    if (l !== 0) {
                         code[l] = code[l].split(']');
                         code[l][0] = code[l][0].split('|')[envIndex] || '';
                         code[l] = code[l].join('');
                    }
                }
                code=code.join('');
                var files=getFileList(code, filename);
                if(files instanceof Error){
                    cb(files,marker);
                    return;
                }

                var list=[];
                var indexes=[];
                var html = [];
                var poses=[];

                for(var i=0;i<files.html.length;i++){
                    var cur=files.html[i];
                    var file=cur.file;
                    if(file.length>=1 && file[0]==='!')
                        html.push(file.substr(1).split('%host%').join(fs.host));
                    else{
                        html.push('');
                        list.push(cur.file);
                        poses.push(cur.pos);
                        indexes.push(i);
                    }
                }
                var css=files.css;
                var js=files.js;
                var cb2=function(err){
                    if(html)
                        html=html.join('\n');
                    var css2=[];
                    var js2=[];

                    css=css.sort(sort);
                    js=js.sort(sort);

                    var i;
                    for(i=0;i<css.length;i++)
                        css2.push(css[i].file);
                    for(i=0;i<js.length;i++)
                        js2.push(js[i].file);
                    cb(err,marker,html,css2,js2);
                };

                fs.getFiles(list, baseFn, function (err, data) {
                    if(err || !data.length){
                        cb2(err);
                        return;
                    }
                    var finished=0;
                    for (var j = 0; j < data.length; j++) {
                        makeFile(data[j], filename, baseFn, j, function(_data,_err,_css,_js,_i){
                            err=err||_err;
                            if(!err) {
                                html[indexes[_i]]=_data;
                                var pos=poses[_i];

                                var k=0;
                                for(k=0;k<_css.length;k++)
                                    css.push({file:_css[k],num:k,pos:pos});
                                for(k=0;k<_js.length;k++)
                                    js.push({file:_js[k],num:k,pos:pos});
                            }
                            finished++;
                            if(finished===data.length)
                                cb2(err);
                        });
                    }
                });
            }
            function getFileList(code,filename) {
                var lastIsDir = false;
                code = code.split('\r').join('\n').split('\n');
                var files = [];
                var lastChars = -1;
                var level = 0;
                var levelChars = {};
                var levelPrefix = {0: ''};
                for (var j = 0; j < code.length; j++) if (code[j].trim() !== '') {
                    var t=code[j].trim();
                    if(t==='' || t[0]==='#')
                        continue;
                    if(t[0]==='!'){
                        files.push(t);
                        continue;
                    }
                    code[j] = code[j].split('\r').join('').split('\t').join(tab);
                    var chars = code[j].length - code[j].replace(/^\s+/, '').length;
                    if (j === 0)
                        levelChars[0] = chars;
                    else {
                        if (chars > lastChars && lastIsDir) {
                            level++;
                            levelChars[level] = chars;
                        }
                        else if (level !== 0 && chars < lastChars) {
                            for (; level >= 0; level--) {
                                if (levelChars[level] <= chars)
                                    break;
                            }
                            level = level===-1 ? 0 : level;
                        }
                    }
                    lastChars = chars;

                    var path = '';
                    if (level !== 0)
                        path = levelPrefix[level - 1];
                    var str = code[j].trim();
                    if (str.length && str[0] === '/' && path.length && path[path.length - 1] === '/')
                        str = str.substr(1);
                    else if ((!str.length || str[0] !== '/')
                        && (!path.length || path[path.length - 1] !== '/'))
                        str = '/' + str;
                    path += str;
                    if (path.length && path[0] === '/')
                        path = path.substr(1);
                    path = path.split('/');
                    lastIsDir = (path.length && path[path.length - 1] === '');
                    if (!lastIsDir)
                        files.push(path.join('/'));
                    else {
                        path[path.length - 1] = '';
                        path = path.join('/');
                        levelPrefix[level] = path;
                    }
                }
                var out={css:[],js:[],html:[]};
                for(var i=0;i<files.length;i++){
                    var ext = fs.getFinalExt(files[i]);
                    if (ext === 'htm'||(files[i].length>1 && files[i][0]==='!'))
                        ext = 'html';
                    if(files[i].length<1|| files[i][0]!=='!')
                        files[i]=fs.joinPathes(filename, files[i]);
                    if((ext==='js'||ext==='css') && ext!==fs.getFileExt(files[i])){
                        var fn2=files[i]+'.'+ext;
                        fs.addLink(fn2,files[i]);
                        files[i]=fn2;
                    }
                    if(out[ext])
                        out[ext].push({file:files[i], pos:i, num:0});
                    else
                        return new Error('Error in use tag in file '+filename+':: '
                            +' try to include file `'+ files[i]+'` that cant convert to css, js or html');
                }
                return out;
            }
        }
    };
};