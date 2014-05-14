var jade = require('jade');
exports.init=function(fs,options){
    options.pretty=options.pretty!==false;//true
    options.self=options.self||false;
    options.debug=options.debug||false;
    options.compileDebug=options.compileDebug||false;
    return {
        exts:'jade',//accept jade
        ext:'html',//convert it to html
        order:100,
        fun:function(data,filename, ext, cb){
            cb(false,jade.compile(data, fs.clone(options,{filename: filename}))(fs.locals(options,'jade','static')));
        }
    };
};