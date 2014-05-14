module.exports={
    initFilters:function(){
        var options=this.options.filters;
        for(var name in options) if(options.hasOwnProperty(name)){
            if(options[name]){
                var filter=require('./filters/' + name.trim() + '.js').init(this,options[name]);
                filter.name=name.trim();
                filter.exts=options[name].exts||filter.exts;
                filter.order=options[name].order||filter.order;
                this.addFilter(filter);
            }
        }
    },
    addFilter:function(filter){
        filter.order=filter.order||100;
        if(typeof(filter.exts)==='string')
            filter.exts = filter.exts.split(' ').join(',').split(',');
        if(filter.exts instanceof Array){
            var tmp={};
            for(var i=0;i<filter.exts.length;i++)
                if(filter.exts[i].trim()!=='')
                    tmp[filter.exts[i].trim()]=true;
            filter.exts=tmp;
        }
        this.filters.push(filter);
        this.filters=this.filters.sort(function(a,b){
            return a.order-b.order;
        });
    },
    locals:function(options,filterName,type){
        return {fastStatic: this, options: this.clone(options)};
    },
    getFinalExt:function(filename){
        var ext=this.getFileExt(filename);
        if(ext===false)
            return ext;
        var arr=this.filters;
        for(var i=0;i<arr.length;i++) {
            if (arr[i].exts[ext] && arr[i].ext)
                ext = arr[i].ext;
        }
        return ext;
    },
    getFileExt:function(filename){
        if(filename.indexOf('.')===-1)
            return filename;
        var ext=filename.split('/');
        ext=ext[ext.length-1].split('.');
        if(ext.length===1)
            return false;
        return ext[ext.length-1];
    },
    compareExt:function(ext1,ext2){
        if(ext1==='jpeg')
            ext1='jpg';
        else if(ext1==='html')
            ext1='htm';

        if(ext2==='jpeg')
            ext2='jpg';
        else if(ext2==='html')
            ext2='htm';
        return (ext1===ext2);
    },
    applyFilters:function(filename,data,toExt,cb){
        var self=this;
        if(typeof(toExt)=='function'){
            cb=toExt;
            toExt=false;
        }
        var ext=this.getFileExt(filename);
        var arr=this.filters;
        function sendErr(err){
            //if(err.code=='ENOENT')
            //    err.message+=' :: Found in file '+filename; //ENOENT
            err.sub=true;
            self.cb(cb, err);
        }
        function applyFilters(start,filename,data,ext){
            for(var i=start;i<arr.length+1;i++){
                if(self.compareExt(ext,toExt)||i===arr.length||ext===false) {
                    self.cb(cb,false, data, ext);
                    break;
                }
                if (arr[i].exts[ext]) {
                    var ext0 = ext;
                    ext = arr[i].ext || ext0;
                    try {
                        arr[i].fun(data, filename, ext0, function (err, data) {
                            if (err)
                                sendErr(err);
                            else if(data instanceof Error)
                                sendErr(data);
                            else
                                applyFilters(i + 1, filename, data, ext);
                        });
                    }
                    catch(err){
                        sendErr(err);
                        return;
                    }
                    break;
                }
            }
        }
        applyFilters(0,filename,data,ext);
    }
};