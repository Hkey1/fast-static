/*
    less renderer
*/
var marked = require('marked');
exports.init=function(fs,options){
    return {
        exts:'md,markdown',//accept md
        ext:'html',//convert it to html
        order:100,
        fun:function(data,filename, ext, cb){
            marked(data, fs.clone(options), function (err, content) {
                cb(err,content);
            });
        }
    };
};