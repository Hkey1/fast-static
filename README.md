fast-static
===========
Node.js module. Simple to use build automation for frontend files.


=Russian
Простой в использовании модуль node.js для облегчения сборки фронтенд файлов.

==Вступление
Использование fast-static намного проще чем других систем сборки.

Вам не нужно писать файл настройки сборки и запускать каждый раз сборку. Сборка происходит на лету.

При этом когда env=production происходит кеширование в памяти и fast-static работает быстрее стандартных middleware Express/Connect и меньше грузит диск и процессор.

==Возможности
* Конвертирует: coffee, haml, less, jade, sass
* Упрощенное подключение файлов через тег use
* Автоопределние mime-type по разширению

Когда env=production производит оптимизацию
* слияние файлов
* вставляет небольшие изображения в css
* кеширует результаты в памяти
* поддерживает gzip (кеширует gzip в памяти)
* поддерживает кеш на стороне браузера (ETag)

==Install
```
    npm install fast-static
```

==Middleware
Интерфейс аналогичен стандартному модулю static в Express/Connect
```javascript
    var fastStatic= require('fast-static');
    app.use(onRoot,fastStatic.use(root,options));//вместо  app.use(onRoot,app.static(root,options));
```
options не обязательный параметр, он редко используется. fastStatic сам настраивается в зависимости от process.env.
Подробнее об опциях в конце документа.

Например,
```javascript
    var app = require('express')();
    var fastStatic= require('fast-static');
    app.use('/static',fastStatic.use('./static'));
    app.listen(process.env.PORT);
```
==Answer
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
==Тег USE
Этот тег упрощает подключение файлов. .js и .css локальные файлы подключенные из него собираются в один при env=production.
Также благодаря этому файлу возможен include html, jade и haml файлов.

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

==Обратите внимание
===Пути идут относительно файла в файловой в системе
Поэтому если вы подключаете файл через answer из другой директории, вы должны использовать тег Base.

Например, вы подключаете вместо homepage файл /static/intro/index.html, то вы в него должны добавить
```html
    <base href="http://<use>!%host%</use>/static/intro/" />
```

Это не касаеться только файлов подключаемых через answer.

===При env=production происходит кеширование
Изменение файлов в этом режиме не произведет к изменениям в ответам.
Вам не обходимо сбросить кеш либо перезагрузкой сервиса, либо fastStatic.dropCash();

===Не используйте для больших файлов
Память не бесконечна и если у вас есть директория с большими файлами (больше 1-2 MB) используйте app.static() или другой аналог.


