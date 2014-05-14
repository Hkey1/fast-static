exports.init=function(fs,options){
    var minify = require('html-minifier').minify;
    options.removeComments              = options.removeComments!==false;// ||true
    options.collapseWhitespace          = options.collapseWhitespace!==false;// ||true
    options.conservativeCollapse        = options.conservativeCollapse!==false;// ||true
    options.collapseBooleanAttributes   = options.collapseBooleanAttributes!==false;// ||true
    options.removeRedundantAttributes   = options.removeRedundantAttributes!==false;// ||true
    options.removeEmptyAttributes       = options.removeEmptyAttributes!==false;// ||true

    return {
        exts:'htm,html',
        order:300,
        fun:function(data,filename, ext, cb){
            data=minify(data, options);//+"<!--minified-->";
            cb(false,data);
        }
    };
};