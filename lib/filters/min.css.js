/*
    minify css
*/
exports.init=function(fs,options){
    var Class=require('clean-css');
    var obj = new Class(options);
    return {
        exts:'css',
        order:300,
        fun:function(data,filename, ext, cb){
            data=obj.minify(data);
            cb(false,data);
        }
    };
};