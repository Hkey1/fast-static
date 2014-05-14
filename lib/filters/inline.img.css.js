/* Inserts into css image files decoded by base 64
 This speeds up page load time by reducing the number of uploaded files.
 url(someFile.jpg) -> url("data:image/jpeg;base64,asSDdeSDS ...")
 Insert only images that
    * len < options.maxLen (default = 4 KB)
    * image is unic in css file
    * link to image must be relative (without http://)
*/

exports.init=function(fs,options){
    options.maxLen=options.maxLen||4096;
    return {
        exts:'css',
        order:201,
        fun:function(data,filename, ext,cb){
            function regex(cb){return data.replace(/url\(["']?(\S*)\.(jpeg|jpg|gif|png)["']?\)/g, cb);}
            var was={};
            regex(function(match, file) {//, type
                if (!was[file])
                    was[file] = 1;
                else
                    was[file]++;
            });
            var replaces=[];
            var files=[];
            var start='_#$_$#rpSlD@ace|*_';//some unical string
            data = regex(function(match, file, type){
                if(fs.isGlobalFile(file)|| was[file]!==1)
                    return match;//no changes
                file=fs.joinPathes(filename,file+'.' + type);
                replaces.push({match:match,file:file,type:type});
                files.push(file);
                return start+(files.length-1)+'|';
            });
            fs.makeFiles(files,function(err,files){
                if(err)
                    cb(err);
                else {
                    for (var i = 0; i < files.length; i++) {
                        var cur=replaces[i];
                        var entry=files[i];
                        var cdata=cur.match;//restore old value
                        if(entry.makedLen<options.maxLen) {
                            cdata = 'url("data:image/' + (cur.type === 'jpg' ? 'jpeg' : cur.type) + ';'
                                +'base64,'+entry.maked.toString('base64') +
                            '")';
                        }
                        data=data.replace(start+i+'|', cdata);
                    }
                    cb(err,data);
                }
            });
        }
    };
};