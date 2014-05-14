var coffee = require('coffee-script');
exports.init=function(fs,options){
    return {
        exts:'coffee,litcoffee',
        ext:'js',
        order:100,
        fun:function(data,filename, ext, cb){
            cb(false,coffee.compile(data,fs.clone(options,{filename:filename})));
        }
    };
};