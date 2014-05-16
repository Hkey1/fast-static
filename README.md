fast-static
===========
Russian: https://github.com/Hkey1/fast-static/blob/master/README_ru-ru.md

Node.js module. Simple to use build automation for frontend files.
You don't need to write specials build files or run build.

When env=production this module use in memory cash.
That make fast-static faster then default Express/Connect static middleware.


##Features
* Converts: coffee, haml, less, jade, sass, md
* Simple to include files (USE tag)
* Simple to include libs
* Autodetect mime-type
* gzip
* browser-side cashing (ETag & hash-in-url with long maxAge)

When env=production
* minify css, js and html
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
About options in the end of this file.


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
For example you nead on homepage send ./static/intro/index.jade
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
        2.sass
        2.coffee
        subdir1/
            3.less
            3.js
        subdir2/
            4.js
            4.css
        subdir3/5.css
    dir2/* # All Files that compiles to css, js or html in dir2 and subdirs
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

        bootstrap 3.1.1 # bootstrap 3.1.1 will be included from CDN (it faster)

        # ! on begin of string tells echo string
        ! Hello world from Use tag <br />

        # you can use %host% constant
        ! host=%host% <br />

        # you can use env switcher [value if env=development|value if env=production]
        ! env=[dev|prod] <br />

        # Next line will be include jquery.js on development, and jquery.min.js on production
        http://site.com/jquery[|.min].js
    </USE>

    <USE>footer.jade</USE><!-- Include file footer.jade -->

    <USE>.js</USE><!-- In this place will be inserted script tags -->
</body>
</html>
```
###dir/*
Include all files that can convert to js,css or html in dir or subdirs.
Warning: if you have both mininfied and non-minified file versions in dir -- fast-static will include both!!!

###Libs
To include lib just enter string with name and version. "bootstrap 3.1.1".

Version is required.

Libs is included from CDN. It fast, faster then from you service.

In lib names case and symbol '-' is ignored JQueryUI=jqueryUI=jqueryui=jquery-UI=jquery-ui.

Libs: bootstrap, font-awesome, jquery, jqueryMigrate, QUnit, jqueryMobile, jqueryUi, angularJS, dojo, extCore, mootools,
      prototype, scriptAculoUs, swfobject, Web-Font-Loader, jQueryColor, jQueryColorSvgNames, jQueryColorPlusNames

Bootstrap, QUnit, jqueryUi, jqueryMobile have alternative version without default template.
Add 0 to the end of libname ('bootstrap-0 3.1.1' or 'bootstrap0 3.1.1').

Libs with CSS and JS have css and js versions ('bootstrapJS 3.1.1').

When env=prod... will be included min file (if CDN have min file);

Version is required. Versions lists:
* for bootstrap http://www.bootstrapcdn.com
* for JQuery https://code.jquery.com/
* for other https://developers.google.com/speed/libraries/devguide


##Warnings
###Pathes are rel to file path in file system
If you use fastStatic.answer you need to add base tag.

Example, if you send on homepage /static/intro/index.html, you need to add in this file
```html
    <base href="http://<use>!%host%</use>/static/intro/" />
```

###On env=production cash is on
In this mode file changes will not lead to changes in the responses.
You need to restart service or call fastStatic.dropCash().

###Dont use on big files
Memory is limiting.
If you have directory with big files (>1-2MB) use other middleware (for example app.static()) on this dir;
Move large files to some dir and use other static middleware.

Example:
```javascript
    var app = require('express')();
    var fastStatic= require('fast-static');
    app.use('/static',fastStatic.use('./static',options));
    app.use('/bigFiles',app.static('./bigFiles',options));
    app.listen(process.env.PORT);
```

###HAML & JADE is static
There are no req/request in locals in this files.

##Why it faster than other middleware?

###in-memory-cash
Compiled files, gzip, and cs are cashed in memory.
To answer fast-static only need to return link to buffer with data.
Other middleware need to read file from and gzip it.

###fast browser-side-cash
fast-static use fast browser-side-cash implimentation.
* fast-static adds md5 of data to URLs of images,css,js files (not html).
* if file changed url also will be changed
* if file url have md5 fast-static sets large maxAge
* so browser without any request loads data from cash

###Summary
For example we have 1.css.
fast-static add to url hash <use>1.css</use> => ``<link rel="1.css?_fs_hash=_md5_of_data_" />``

Browser requests this file (first time).

Other middleware need to read this file from disc and get file stats, and gzip answer.
Fast-static just return cashed in memory gzipped data, no disk usage.

Fast-static adds cash maxAge header with large value (because Fast-static find hash in url);

If browser need this file again.

Other middleware: browser send request with header if-modified,
it takes some time (ping),
middleware checks file mtime (small disc usage),
and answer "304 not-modified".
Browser load page from cash.

Fast-static: Max-age not expired -- browser not send any requests just load from cash.

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
addHash         | Add Hash to file url. Its speed-up browser side cash. | false/true
hashedMaxAge    | Cash maxAge in ms when url have hash                  | 1 year: 365 * 24 * 60 * 60 * 1000
production      | Options overwrite for env=production                  | {}
development     | Options overwrite for env=development                 | {}


###addHash/hashedMaxAge
addHash/hashedMaxAge applies to images in css files and js (coffee) and css(less,sass) when they included from use Tag.
url(file.png) -> url(file.png?_fc_hash=_MD5_of_File_Content_)
If file content changed -- url will be changed. That`s why we can use very long MaxAge.

###Options.filters
To disable filter you nead to set options.filters[filterName]=false
To enable filter you nead to set options.filters[filterName]=filterOptions


This filters are by default is ON

Filter          |                                                       | url
-------------   | ----------------                                      |-------------
coffee          | compiles coffescript                                  | https://github.com/jashkenas/coffee-script
haml            | compiles haml                                         | https://github.com/creationix/haml-js
jade            | compiles jade                                         | https://github.com/visionmedia/jade
less            | compiles less                                         | https://github.com/less/less.js
saas            | compiles saas                                         | https://github.com/andrew/node-sass
md              | compiles md                                           | https://github.com/chjj/marked
use             | compiles USE tag                                      |


This filters are is ON only on Production by default

Filter          |                                                           | url
-------------   | ----------------                                          |-------------
min.css         | minimify css                                              | https://github.com/GoalSmashers/clean-css
min.js          | minimify js                                               | http://lisperator.net/uglifyjs
min.html        | minimify html                                             | http://github.com/kangax/html-minifier/
inline.img.css  | insert small images into css, and hash to urls of others  |



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
vars            | Replacer {foo:bar} tells to replace %foo% to bar               | {}
libs            | addition libs. See filters/use.js                              | {}

Other filters options see by links in table with list of filters

##Writing you own filter
```javascript
    fastStatic.addFilter({
        exts:'tea,littea',// list of in extension
        ext:'js',// out extension or false if not changes
        order:100,// order=
            //100 for compilers,
            //300 for minimizators
            //200 for small format updates (as use TAG)
        fun:function(data,filename, ext, cb){
            //..
            cb(err,data);
        }
    });
```


