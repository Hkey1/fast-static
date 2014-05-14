/*
    при сборке менять у css url
*/
var sass = require('node-sass');
exports.init=function(fs,options){
    return {
        exts:'sass',
        ext:'css',
        order:100,
        fun:function(data,filename, ext, cb){
            sass.render(fs.clone(options,{
                data: data,
                success: function(css) {
                    cb(false,css);
                },
                error: function(err) {
                    cb(err);
                },
                includePaths: (options.includePaths||['/']).concat([fs.dirname(filename)+'/'])
            }));
        }
    };
};