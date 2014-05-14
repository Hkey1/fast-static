exports.init=function(fs,options){
    var UglifyJS = require("uglify-js");
    options.fromString=true;
    return {
        exts:'js',
        order:300,
        fun:function(data,filename, ext, cb){
            data =UglifyJS.minify(data,options);
            cb(false,data.code);
        }
    };
};