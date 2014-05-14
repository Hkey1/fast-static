fast-static
===========
Простой в использовании модуль node.js для облегчения сборки фронтенд файлов.

Вступление
-------------
Использование fast-static намного проще чем других систем сборки.

Вам не нужно писать файл настройки сборки и запускать каждый раз сборку. Сборка происходит на лету.

При этом когда env=production происходит кеширование в памяти и fast-static работает быстрее стандартных middleware Express/Connect и меньше грузит диск и процессор.

Возможности
-------------
* Конвертирует: coffee, haml, less, jade, sass, md
* Упрощенное подключение файлов через тег use
* Автоопределение mime-type по разширению

Когда env=production производит оптимизацию
* минимизация css, js и html
* слияние файлов
* вставляет небольшие изображения в css
* кеширует результаты в памяти
* поддерживает gzip (кеширует gzip в памяти)
* поддерживает кеш на стороне браузера (ETag)

Install
-------------
```
    npm install fast-static
```

Middleware
-------------
Интерфейс аналогичен стандартному middleware static в Express/Connect
```javascript
    var fastStatic= require('fast-static');
    app.use(onRoot,fastStatic.use(root,options));//вместо  app.use(onRoot,app.static(root,options));
```
options не обязательный параметр, он редко используется. fastStatic сам настраивается в зависимости от process.env.NODE_ENV.
Подробнее об опциях в конце документа.

Например,
```javascript
    var app = require('express')();
    var fastStatic= require('fast-static');
    app.use('/static',fastStatic.use('./static'));
    app.listen(process.env.PORT);
```

Answer
-------------
Нужно чтобы по определенному пути ответить специальным файлом.
```javascript
    fastStatic.answer(req,res,pathToFile);
```
Например ответить файлом вместо homepage вывести ./static/intro/index.jade
```javascript
    var app = require('express')();
    var fastStatic= require('fast-static');
    app.use('/static',fastStatic.use('./static',options));
    app.get('/',function(req,res){
        fastStatic.answer(req,res,'./static/intro/index.jade');
    });
    app.listen(process.env.PORT);
```

Тег USE
-------------
Этот тег упрощает подключение файлов. .js и .css локальные файлы подключенные из него собираются в один при env=production.
Также благодаря этому файлу возможен include html, jade и haml файлов.

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
</USE>
<html>
<head>
    <title>Привет, мир!</title>
    <USE>.css</USE><!-- сюда пойдут теги подключения css файлов  -->
</head>
<body>
    <USE>header.html</USE><!-- Include file header.html -->
    <h1>Привет, мир!</h1>
    <USE>
        #Это комментарий

        # `!` в начале строки значит вывод строки
        ! Тег Use тоже передает привет миру <br />

        # Вы можете использовать константу %host%
        ! хост=%host% <br />

        # можно использовать свитч [value if env=development|value if env=production]
        ! env=[dev|prod] <br />

        # Следующая строка подключит jquery.js когда env=development и jquery.min.js в противном случае
        http://site.com/jquery[|.min].js
    </USE>

    <USE>footer.jade</USE><!-- Include file footer.jade -->

    <USE>.js</USE><!-- сюда пойдут теги подключения js файлов  -->
</body>
</html>
```

Обратите внимание
-------------
###Пути идут относительно файла в файловой системе
Поэтому если вы подключаете файл через answer из другой директории, вы должны использовать тег Base.

Например, вы подключаете вместо homepage файл /static/intro/index.html, то вы в него должны добавить
```html
    <base href="http://<use>!%host%</use>/static/intro/" />
```

Это касается только файлов подключаемых через answer.

###При env=production происходит кеширование
Изменение файлов в этом режиме не произведет к изменениям в ответах.
Чтобы изменения вступили в силу, вам необходимо сбросить кеш либо перезагрузкой сервиса, либо fastStatic.dropCash();

###Не используйте для больших файлов
Память не бесконечна и если у вас есть директория с большими файлами (больше 1-2 MB) используйте app.static() или другой аналог.
Перекиньте большие файлы в специальную директорию и используйте другой middleware.
Например,
```javascript
    var app = require('express')();
    var fastStatic= require('fast-static');
    app.use('/static',fastStatic.use('./static',options));
    app.use('/bigFiles',app.static('./bigFiles',options));
    app.listen(process.env.PORT);
```

###HAML и JADE компилируются статически
HAML и JADE компилируются статически без учета контекста запроса. req в них недоступен.

Options
-------------
Модуль поддерживает все опции стандартного static middleware Express/Connect http://www.senchalabs.org/connect/static.html

Options         |                                                       | default (dev/prod)
-------------   | ----------------                                      |-------------
maxAge          | Browser cache maxAge в миллисекундах.                 | 0
hidden          | Возвращать скрытые файлы (начинающиеся с точки)       | false
redirect        | Добавлять редиректом "/" к концу имени директории     | true
index           | Вместо директории открывать файл с именем             | 'index.html'
env             | 'production' or 'development'                         | process.env.NODE_ENV
gzip            | использовать gzip                                     | true
dateHeader      | отправлять date header                                | false
cash            | кешировать в памяти                                   | false/true

###Options.filters
Для отключения фильтра установите options.filters[filterName]=false
Для всключения options.filters[filterName]=filterOptions или просто options.filters[filterName]={}

Эти опции включены по умолчанию все зависимости от env

Filter          |                                                       | url
-------------   | ----------------                                      |-------------
coffee          | compiles coffescript                                  | https://github.com/jashkenas/coffee-script
haml            | compiles haml                                         | https://github.com/creationix/haml-js
jade            | compiles jade                                         | https://github.com/visionmedia/jade
less            | compiles less                                         | https://github.com/less/less.js
saas            | compiles saas                                         | https://github.com/andrew/node-sass
md              | compiles md                                           | https://github.com/chjj/marked
use             | compiles USE tag                                      | none


Эти опции включены по умолчанию только на продакшене

Filter          |                                                       | url
-------------   | ----------------                                      |-------------
min.css         | minimify css                                          | https://github.com/GoalSmashers/clean-css
min.js          | minimify js                                           | http://lisperator.net/uglifyjs
min.html        | minimify html                                         | http://kangax.github.io/html-minifier/
inline.img.css  | вставлять маленькие картинки в css                    | none



###Опции фильтров
Все фильтры имеют опции exts and order
* exts= список расширений. "html,htm"
* order= int. Порядок выполнения 100 -компиляторы, 300 - оптимизаторы



###Options.filters['inline.img.css']

Options         |                                                                | default
-------------   | ----------------                                               |-------------
maxLen          | Если размер файла картинки меньше этого, то она будет вставлена| 4096  (4KB)

###Options.filters['use']

Options         |                                                                | default (dev/prod)
-------------   | ----------------                                               |-------------
tabLen          | Длина таба в пробелах. Целоче число                            | 4
joinFiles       | Объеденять файлы в один (css,js)                               | false/true


##Ваш собственный фильтр
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