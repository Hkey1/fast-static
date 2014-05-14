/*
    less renderer
*/
var less = require('less');
exports.init=function(fs,options){
    return {
        exts:'less',//accept less
        ext:'css',//convert it to css
        order:100,
        fun:function(data,filename, ext, cb){
            var arr=filename.split('/');
            new(less.Parser)({
                paths: (options.paths||['.']).concat([fs.dirname(filename)]),
                filename: arr[arr.length-1]
            }).parse(data, function (err, tree) {
                if(!err)
                    data=tree.toCSS({compress: options.compress});
                cb(err,data);
            });
        }
    };
};