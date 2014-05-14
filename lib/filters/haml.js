var haml = require('haml');
exports.init=function(fs,options){
    options=options||{};
    options.locals=fs.locals(options,'haml','static');//
    //options.context||HAML
    return {
        exts:'haml',//accept less
        ext:'html',//convert it to css
        order:100,
        fun:function(data,filename, ext, cb){
            cb(false,haml.render(data,fs.clone(options)));
        }//Parser
    };
};