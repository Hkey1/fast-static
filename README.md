fast-static
===========
Russian: https://github.com/Hkey1/fast-static/blob/master/README_ru-ru.md

Node.js module. Simple to use build automation for frontend files.
You don't need to write specials build files or run build.

When env=production this module use in memory cash.
That make fast-static faster then default Express/Connect static middleware.



##Features
* Converts: coffee, haml, less, jade, sass, md
* Simple include files (use tag)
* Autodetect mime-type
* gzip
* browser cashing (ETag)

When env=production
* minify css, js и html
* join files
* inserts small images into css
* in-memory-cash (compiled files, gzip results and ETag).


##Install
```
    npm install fast-static
```

##Middleware
Like static middleware in Express/Connect
```javascript
    var fastStatic= require('fast-static');
    app.use(onRoot,fastStatic.use(root,options));// app.use(onRoot,app.static(root,options));
```
Options is not required param.
fastStatic have options presets based on process.env.NODE_ENV.
About options in the end of doc.


Example
```javascript
    var app = require('express')();
    var fastStatic= require('fast-static');
    app.use('/static',fastStatic.use('./static'));
    app.listen(process.env.PORT);
```
##Answer
Answer some file
```javascript
    fastStatic.answer(req,res,pathToFile);
```
For example you nead on home page send ./static/intro/index.jade
```javascript
    var app = require('express')();
    var fastStatic= require('fast-static');
    app.use('/static',fastStatic.use('./static',options));
    app.get('/',function(req,res){
        fastStatic.answer(req,res,'./static/intro/index.jade');
    });
    app.listen(process.env.PORT);
```
##USE tag
Tag to simply listing of files.

```html
<USE>
    1.js
    1.css
    dir/
        2.saas
        2.coffee
        subdir1/
            3.less
            3.js
        subdir2/
            4.js
            4.css
        subdir3/5.css
</USE>

<html>
<head>
    <title>Hello world</title>
    <USE>.css</USE><!-- In this place will be inserted link (css) tags -->
</head>
<body>
    <USE>header.html</USE><!-- Include file header.html -->
    <h1>Hello world</h1>
    <USE>
        #this is comment

        # ! on begin of string tells echo string
        ! Hello world from Use tag <br />

        # you can use %host% constant
        ! host=%host% <br />

        # you can use env switcher [value if env=development|value if env=production]
        ! env=[dev|prod] <br />

        # Next line tels include jquery.js on development, and jquery.min.js on production
        http://site.com/jquery[|.min].js
    </USE>

    <USE>footer.jade</USE><!-- Include file footer.jade -->

    <USE>.js</USE><!-- In this place will be inserted script tags -->
</body>
</html>
```

##Warnings
###Pathes are rel to file path in file system
If you use fastStatic.answer you nead to add base tag.

Example, if you send on homepage /static/intro/index.html, you nead to add in this file
```html
    <base href="http://<use>!%host%</use>/static/intro/" />
```

###On env=production cash is on
In this mode file not lead to changes in the responses. You nead restart service on call fastStatic.dropCash().

###Dont use on big files
Memory is limiting. If you have directory with big files (>1-2MB) use other middleware (for example app.static()) on this dir;

###HAML & JADE is static
There are no req/request in locals in this files

##Options
Options         |                                                       | default (dev/prod)
-------------   | ----------------                                      |-------------
maxAge          | Browser cache maxAge in milliseconds.                 | 0
hidden          | Allow transfer of hidden files                        | false
redirect        | Redirect to trailing "/" when the pathname is a dir   | true
index           | Default file name                                     | 'index.html'
env             | 'production' or 'development'                         | process.env.NODE_ENV
gzip            | use gzip                                              | true
dateHeader      | send date header                                      | false
cash            | cash                                                  | false/true

###Options.filters
To disable filter you nead to set options.filters[filterName]=false
To enable filter you nead to set options.filters[filterName]=filterOptions


This filters are by default is ON

Filter          |                                                       |
-------------   | ----------------                                      |-------------
coffee          | compiles coffescript                                  | https://github.com/jashkenas/coffee-script
haml            | compiles haml                                         | https://github.com/creationix/haml-js
jade            | compiles jade                                         | https://github.com/visionmedia/jade
less            | compiles less                                         | https://github.com/less/less.js
saas            | compiles saas                                         | https://github.com/andrew/node-sass
md              | compiles md                                           | https://github.com/chjj/marked
use             | compiles USE tag                                      |


This filters are is ON only on Production by default

Filter          |                                                       |
-------------   | ----------------                                      |-------------
min.css         | minimify css                                          | https://github.com/GoalSmashers/clean-css
min.js          | minimify js                                           | http://lisperator.net/uglifyjs
min.html        | minimify html                                         | http://kangax.github.io/html-minifier/
inline.img.css  | insert small images into css                          |



###Filters options
All filters have exts and order options.
* exts= list of file exts. For example "html,htm"
* order= int


###Options.filters['inline.img.css']

Options         |                                                                | default
-------------   | ----------------                                               |-------------
maxLen          | If len of image file >  maxLen image will not be insert in css | 4096  (4KB)

###Options.filters['use']

Options         |                                                                | default (dev/prod)
-------------   | ----------------                                               |-------------
tabLen          | Len of tab symbol in spaces                                    | 4
joinFiles       | join files into one                                            | false/true


##Writing you own filter
```javascript
    fastStatic.addFilter({
        exts:'tea,littea',// list of in extension
        ext:'js',// out extension or false if not changes
        order:100,// order 100 for compilers, 300 for minimizators
        fun:function(data,filename, ext, cb){
            //..
            cb(err,data);
        }
    });
```


