var crypto = require('crypto');
var _readdir = require('recursive-readdir');
var readDir=function(dir,marker,cb){
    _readdir(dir,function(err,files){
        cb(err,files,marker);
    });
};
function verToInt(a){
    a=a.split('.');
    var c=Math.pow(100.1,5);
    var sum=0;
    for(var i=0;i<a.length;i++){
        if(a[i] * 1 > 50)
            break;
        sum+=a[i] * c;
        c=c/100.1;
    }
    return sum;
}


var libs= {
    'bootstrapJs': {
        '3':['//netdna.bootstrapcdn.com/bootstrap/%libVer%/js/bootstrap[|.min].js'],
        '2':['//netdna.bootstrapcdn.com/twitter-bootstrap/%libVer%/js/bootstrap[|.min].js']
    },
    'bootstrapThemeCss':{
        '3':['//netdna.bootstrapcdn.com/bootstrap/%libVer%/css/bootstrap-theme[|.min].css'],
        '2':[]
    },
    'bootstrap0Css':{
        '3':['//netdna.bootstrapcdn.com/bootstrap/%libVer%/css/bootstrap[|.min].css'],
        '2':['//netdna.bootstrapcdn.com/twitter-bootstrap/%libVer%/css/bootstrap-combined.min.css']//no have not min version
    },
    'bootstrapCss':        ['bootstrap0Css %libVer%', 'bootstrapThemeCss %libVer%'],
    'bootstrap0':          ['bootstrap0Css %libVer%', 'bootstrapJs %libVer%'],
    'bootstrap':           ['bootstrapCss %libVer%',  'bootstrapJs %libVer%'],

    'font-awesome':        ['//netdna.bootstrapcdn.com/font-awesome/%libVer%/css/font-awesome[|.min].css'],

    'jquery':              ['//code.jquery.com/jquery-%libVer%[|.min].js'],
    'jqueryMigrate':       ['//code.jquery.com/jquery-migrate-%libVer%[|.min].js'],

    'jQueryColor':         ['//code.jquery.com/color/jquery.color-%libVer%[|.min].js'],
    'jQueryColorSvgNames': ['//code.jquery.com/color/jquery.color.svg-names-%libVer%[|.min].js'],
    'jQueryColorPlusNames':['//code.jquery.com/color/jquery.color.plus-names-%libVer%[|.min].js'],

    'qunitCss':            ['//code.jquery.com/qunit/qunit-%libVer%.css'],
    'qunitJS':             ['//code.jquery.com/qunit/qunit-%libVer%.js'],
    'qunit0':              ['qunitJS %libVer%'],
    'QUnit':               ['qunitJS %libVer%','qunitCss %libVer%'],

    'jqueryMobileCSS':     ['//code.jquery.com/mobile/%libVer%/jquery.mobile-%libVer%[|.min].css'],
    'jqueryMobileCSS0':    ['//code.jquery.com/mobile/%libVer%/jquery.mobile.structure-%libVer%[|.min].css'],
    'jqueryMobileJS':      ['//code.jquery.com/mobile/%libVer%/jquery.mobile-%libVer%[|.min].js'],
    'jqueryMobile0':       ['jqueryMobileCSS0 %libVer%','jqueryMobileJS %libVer%'],
    'jqueryMobile':        ['jqueryMobileCSS %libVer%' ,'jqueryMobileJS %libVer%'],

    'jqueryUiJS':          ['//code.jquery.com/ui/%libVer%/jquery-ui.min.js'],
    'jqueryUiCss':         ['//code.jquery.com/ui/%libVer%/themes/smoothness/jquery-ui.css'],
    'jqueryUi':            ['jqueryUiCss %libVer%','jqueryUiJs %libVer%'],
    'jqueryUi0':           ['jqueryUiJs %libVer%'],

    'angularJS':           ['%gapi%/angularjs/%libVer%/angular[|.min].js'],
    'dojo':                ['%gapi%/dojo/%libVer%/dojo/dojo.js'],
    'extCore':             ['%gapi%/ext-core/%libVer%/ext-core.js'],
    'mootools':            ['%gapi%/mootools/%libVer%/mootools-yui-compressed.js'],
    'prototype':           ['%gapi%/prototype/%libVer%/prototype.js'],
    'scriptAculoUs':       ['%gapi%/scriptaculous/%libVer%/scriptaculous.js'],
    'swfobject':           ['%gapi%/swfobject/%libVer%/swfobject.js'],
    'Web-Font-Loader':     ['%gapi%/webfont/%libVer%/webfont.js']
};
exports.init=function(fs,options){
    options.tabLen=options.tabLen||4;

    options.libs=options.libs||{};
    options.vals=options.vals||{};

    var i;
    for(i in libs) if(libs.hasOwnProperty(i)) {
        if (!options.libs[i])
            options.libs[i] = libs[i];
    }
    var tmp={};
    for(i in options.libs) if(options.libs.hasOwnProperty(i))
        tmp[i.toLowerCase().split('-').join('')]=options.libs[i];
    options.libs=tmp;

    var tab='';
    for (i= 0; i < options.tabLen;i++)
        tab+=' ';

    return {
        exts:'html,htm',
        order:200,
        fun:function(data,filename, ext, cb) {
            options.vals.host=options.vals.host||fs.host;

            var start = '#$g2cS#$#$';//some unic string
            var cssMarker = start + '.css' + '|';
            var jsMarker = start + '.js' + '|';
            var sort=function(a,b) {
                return (a.pos !== b.pos) ?  a.pos - b.pos : a.num - b.num;
            };
            function sendErr(cb,err,filename){
                if(err){
                    err.sub=true;
                    err.message+=':: In USE tag in file '+filename;
                   // console.error(err);
                    fs.cb(cb,err);
                }
                return err;
            }
            makeFile(data, filename, filename, false, function(err,data,css,js){
                if(sendErr(cb,err,filename))
                    return;
                function eachFile(css,js,_cb){
                    var i;
                    for(i=0;i<css.length;i++)
                        _cb('css',css[i],i);
                    for(i=0;i<js.length;i++)
                        _cb('js',js[i],i);
                }
                function eachExt(css,js,_cb){
                    _cb('css',css);
                    _cb('js',js);
                }
                var base=fs.dirname(filename);
                if (options.joinFiles) {
                    var fn;
                    var f0={js:[],css:[]}; //files to single insert
                    var f2={js:[],css:[]}; //files to join
                    eachFile(css,js,function(ext,cur){
                        if(fs.isGlobalFile(cur))
                            f0[ext].push(cur);
                        else
                            f2[ext].push(cur);
                    });
                    eachExt(css,js,function(ext,arr){
                        if(f2[ext].length){
                            var fn= fs.hash(f2[ext].join('\n')) + '.'+ext;
                            fs.addLink(fs.joinPathes(base,fn), f2[ext], '\n');
                            f0[ext].push(fn);
                        }
                    });
                    js=f0.js;
                    css=f0.css;
                }
                var list=[];
                eachFile(css,js,function(ext,cur){
                    if(!fs.isGlobalFile(cur))
                        list.push(fs.joinPathes(base,cur));
                });
                fs.makeFiles(list,function(err,arr){
                    if(sendErr(cb,err,filename))
                        return;
                    var hashes={};
                    for(var i=0;i<list.length;i++)
                        hashes[list[i]]=arr[i].hash;
                    var cssCode = '';
                    var jsCode = '';
                    var base = fs.dirname(filename);
                    eachFile(css,js,function (ext, cur) {
                        var hash= hashes[fs.joinPathes(base,cur)];
                        if (cur.indexOf(base) === 0)
                            cur = cur.substr(base.length);
                        if (cur[0] === '/' && cur[1] !== '/')
                            cur = cur.substr(1);
                        cur=fs.addHash(cur,hash);
                        if (ext === 'css')
                            cssCode += '<link href="'  + cur + '" rel="stylesheet" />\n';
                        else
                            jsCode  += '<script src="' + cur + '" type="text/javascript"></script>\n';
                    });

                    cssCode = '\n' + cssCode;
                    jsCode = '\n' + jsCode;

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
                    fs.cb(cb,false, data);
                });
            });
            function makeFile(data, filename, baseFn, marker, cb) {
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
                    makeEntry(i, entries[i], filename, baseFn, function (err, _i, _data, _css, _js) {
                        if(sendErr(cb,err,filename))
                            return;

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
                            fs.cb(cb,false,data, css2, js2, marker);
                        }
                    });
                }
                if (entries.length === 0)
                    fs.cb(cb,false,data,css,js,marker);
            }
            function envSwitch(code){
                code = code.split('[');
                var envIndex = fs.options.env === 'production' ? 1 : 0;
                for (var l = 0; l < code.length; l++) {
                    if (l !== 0) {
                        code[l] = code[l].split(']');
                        code[l][0] = code[l][0].split('|')[envIndex] || '';
                        code[l] = code[l].join('');
                    }
                }
                return code.join('');
            }
            function makeEntry(marker, code, filename, baseFn,cb) {
                for(var i in options.vals) if(options.vals.hasOwnProperty(i))
                    code=code.split('%'+i+'%').join(options.vals[i]);
                getFileList(envSwitch(code), filename,baseFn,function(err,files){
                    if(sendErr(cb,err,filename))
                        return;
                    var list=[];
                    var indexes=[];
                    var html = [];
                    var poses=[];

                    for(var i=0;i<files.html.length;i++){
                        var cur=files.html[i];
                        var file=cur.file;
                        if(file.length>=1 && file[0]==='!')
                            html.push(file.substr(1));
                        else{
                            html.push('');
                            list.push(cur.file);
                            poses.push(cur.pos);
                            indexes.push(i);
                        }
                    }
                    var css=files.css;
                    var js=files.js;
                    var cb2=function(err,marker,html,css,js){
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
                        fs.cb(cb,false,marker,html,css2,js2);
                    };

                    fs.getFiles(list, baseFn, function (err, data) {
                        if(sendErr(cb,err,filename))
                            return;
                        else if(!data.length)
                            cb2(err,marker,html,css,js);
                        var finished=0;
                        for (var j = 0; j < data.length; j++) {
                            makeFile(data[j], filename, baseFn, j, function(err,_data,_css,_js,_i){
                                if(sendErr(cb,err,filename))
                                    return;
                                html[indexes[_i]]=_data;
                                var pos=poses[_i];

                                var k=0;
                                for(k=0;k<_css.length;k++)
                                    css.push({file:_css[k],num:k,pos:pos});
                                for(k=0;k<_js.length;k++)
                                    js.push({file:_js[k],num:k,pos:pos});
                                finished++;
                                if(finished===data.length)
                                    cb2(err,marker,html,css,js);
                            });
                        }
                    });
                });
            }
            function getFileList(code,filename,baseFn, cb) {
                var lastIsDir = false;
                code = code.split('\r').join('\n').split('\n');
                var files = [];
                var lastChars = -1;
                var level = 0;
                var levelChars = {};
                var levelPrefix = {0: ''};
                var code2=[];
                var j,t;
                var was=true;
                var l=0;
                while(was) {
                    was=false;
                    for (j = 0; j < code.length; j++) {
                        code[j] = code[j].split('#')[0];
                        t = code[j].trim();
                        if (t === '')
                            continue;
                        t = t.split('\t').join(' ').split('  ').join(' ').split('  ').join(' ').split('  ').join(' ').split('  ').join(' ');
                        t = t.split(' ');
                        if(j<3){
                            var ssfdf=23;
                        }
                        var lib = options.libs[t[0].toLowerCase().split('-').join('')];
                        if (t[0][0]!=='!' && t.length === 2 && !!lib) {
                            var k;
                            if(!(lib instanceof Array)){
                                var curVer=verToInt(t[1])- 1;
                                var best=false;
                                var bestV=-1;
                                for (k in lib) if(lib.hasOwnProperty(k)){
                                    var v=verToInt(k);
                                    if(v <= curVer && v > bestV) {
                                        best = lib[k];
                                        bestV=v;
                                    }
                                }
                                if(!best) {
                                    cb(new Error(t[0]+' Version '+t[1]+' nor found'));
                                    return;
                                }
                                lib=best;
                            }
                            for (k = 0; k < lib.length; k++) {
                                var tsdfsd=2;
                                code2.push(
                                    envSwitch(
                                        lib[k]
                                            .split('%libVer%').join(t[1])
                                            .split('%gapi%').join('//ajax.googleapis.com/ajax/libs')
                                    )
                                );
                            }
                            was = true;
                            var lastLib=t[0];
                        } else
                            code2.push(code[j]);
                    }
                    code=code2;
                    code2=[];
                    l++;
                    if(l===10){
                        var err=new Error('Infinity loop in '+filename+' on lib '+lastLib);
                        cb(err);
                        console.log(err);
                        return;
                    }
                }
                for (j = 0; j < code.length; j++){
                    t=code[j].trim();
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
                    var str=code[j].trim();
                    lastIsDir = (str.length && str[str.length - 1] === '/');
                    if((str[0]==='.' && str[1]==='/')||fs.isGlobalFile(str)){
                        if(lastIsDir)
                            levelPrefix[level] = str;
                        else
                            files.push(str);
                        continue;
                    }
                    if (str.length && str[0] === '/' && path.length && path[path.length - 1] === '/')
                        str = str.substr(1);
                    else if ((!str.length || str[0] !== '/')
                        && (!path.length || path[path.length - 1] !== '/'))
                        str = '/' + str;
                    path += str;
                    if (path.length && path[0] === '/')
                        path = path.substr(1);
                    path = path.split('/');
                    if (!lastIsDir)
                        files.push(path.join('/'));
                    else {
                        path[path.length - 1] = '';
                        path = path.join('/');
                        levelPrefix[level] = path;
                    }
                }

                var i;
                var dirs=[];
                var dirsPos=[];
                for(i=0;i<files.length;i++){
                    var cur=files[i].trim();
                    if(cur==='*' || (cur[cur.length-2]==='/' && cur[cur.length-1]==='*')){
                        dirs.push(fs.joinPathes(filename,cur.substr(0,cur.length-1)));
                        dirsPos.push(i);
                    }
                }
                function final(files){
                    var out={css:[],js:[],html:[]};
                    for(var i=0;i<files.length;i++){
                        ext = fs.getFinalExt(files[i]);
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
                        else {
                            fs.cb(cb,Error('Error in use tag in file ' + filename + ':: '
                                + ' try to include file `' + files[i] + '` that cant convert to css, js or html'));
                            return;
                        }
                    }
                    fs.cb(cb,false,out);
                }
                if(!dirs.length)
                    final(files);
                else{
                    var finished=0;
                    for(i=0; i<dirs.length; i++){
                        readDir(dirs[i],dirsPos[i],function(err,files0,_i){
                            if(sendErr(cb,err,filename))
                                return;
                            var files2 = [];
                            var j,ext;
                            var base=fs.dirname(filename);
                            for (j = 0; j < files0.length; j++) {
                                var fn = files0[j];
                                fn='./'+fn.split('\\').join('/');
                                if(fn===filename||fn===baseFn)
                                    continue;
                                if(fn.indexOf(base+'/')===0||fn.indexOf(base+'\\')===0)
                                    fn=fn.substr(base.length+1);
                                if (fs.options.hidden || !fs.isHidden(fn)) {
                                    ext  = fs.getFinalExt(fn);
                                    if (ext === 'js' || ext === 'css' || ext === 'htm' || ext === 'html')
                                        files2.push(fn);
                                }
                            }
                            files[_i] = files2;
                            finished++;
                            if(finished===dirs.length){
                                var out2=[];
                                for(j=0;j<files.length;j++){
                                    if(files[j] instanceof Array){
                                        for(var k=0;k<files[j].length;k++)
                                            out2.push(files[j][k])
                                    }
                                    else
                                        out2.push(files[j]);
                                }
                                final(out2);
                            }
                        });
                    }
                }
            }
        }
    };
};