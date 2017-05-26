 var gulp = require('gulp'),
	less = require('gulp-less'), // подключили less
	postcss = require('gulp-postcss'), // Для автоматизации autoprefixer и mqpacker
	autoprefixer = require('autoprefixer'), // Для вендорных префиксов
	cssnano     = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
	mqpacker = require('css-mqpacker'), // Для группировки media-query правил
	browserSync = require('browser-sync'), // Подключаем Browser Sync
	concat = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
	uglify = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
	rename = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
    notify = require('gulp-notify'), // Для информационных сообщений
	imagemin = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
	pngquant = require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
	cache = require('gulp-cache'), // Подключаем библиотеку кеширования
	fileinclude = require('gulp-file-include'), // Для сборки HTML
	replace = require('gulp-replace'), // Для замены текста и пр.
	sftp = require('gulp-sftp'),
    del = require('del'),
    svgstore = require('gulp-svgstore'),
	svgmin = require('gulp-svgmin'),
	cheerio = require('gulp-cheerio'),
	size = require('gulp-size');

// Компиляция LESS
gulp.task('less', function() { 
	console.log('---------- Компиляция LESS');
	return gulp.src('src/less/*.less') // Берем less только с первого уровня
		.pipe(less()) // Преобразуем LESS в CSS посредством gulp-less
		.on('error', notify.onError(function(err) {  // Отлавливаем ошибки компиляции
			return {
				title: 'Styles compilation error',
				message: err.message
			}
		}))
		.pipe(postcss([
			autoprefixer({browsers: ['last 3 version']}), // вендорные префиксы
			mqpacker({sort: true}), // конкатенация media query
		]))
		.pipe(gulp.dest('src/css')) // Выгружаем результата в папку app/css
		.pipe(browserSync.reload({stream: true})) // Обновляем CSS на странице при изменении
});

// Минификация CSS для продакшена
gulp.task('css', ['less'], function() {
	console.log('---------- Минификация CSS');
    return gulp.src('src/css/main.css') // Выбираем файл для минификации
        .pipe(cssnano()) // Сжимаем
       	.pipe(rename({suffix: '.min'})) // Добавляем суффикс .min
        .pipe(gulp.dest('src/css')); // Выгружаем в папку app/css
});

// Сборка и минификация собственного JS для продакшена
gulp.task('js', function() {
	console.log('---------- Минификация JS');
	gulp.src('src/js/scripts.js')
		.pipe(concat('scripts.min.js')) // Собираем их в кучу в новом файле scripts.min.js
		.pipe(uglify()) // Сжимаем JS файл
		.pipe(gulp.dest('src/js')); // Выгружаем в папку build/js
	return browserSync.reload({stream: true});
});

// Сборка и минификация CSS библиотек
gulp.task('css-libs', function() {
	console.log('---------- Минификация CSS библиотек');
    return  gulp.src([ // Берем все необходимые библиотеки
    		'src/css/libs/normalize.css',
		])
        .pipe(concat('libs.min.css')) // Собираем их в кучу в новом файле libs.min.css
        .pipe(cssnano()) // Сжимаем
        .pipe(gulp.dest('src/css')); // Выгружаем в папку app/css
});

// Сборка и минификация JS библиотек
gulp.task('js-libs', function() {
	console.log('---------- Минификация JS библиотек');
	return gulp.src([ // Берем все необходимые библиотеки
			'',
		])
		.pipe(concat('libs.min.js')) // Собираем их в кучу в новом файле libs.min.js
		.pipe(uglify()) // Сжимаем JS файл
		.pipe(gulp.dest('src/js')); // Выгружаем в папку app/js
});

// Обработка библиотек для продакшена
gulp.task('libs', function() {
	console.log('---------- Обработка библиотек');
	gulp.start('js-libs');
	gulp.start('css-libs');
});

// Оптимизация изображений
gulp.task('img', function() {
	console.log('---------- Копирование и оптимизация картинок');
    return gulp.src('src/img/**/*.png') // Берем все изображения из app
        .pipe(cache(imagemin({  // Сжимаем их с наилучшими настройками
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('build/img')); // Выгружаем на продакшен
});

//Сборка 
gulp.task('svg', function (callback) {
  let spritePath = 'src/svg/icons/';
  if(fileExist(spritePath) !== false) {
    console.log('---------- Сборка SVG спрайта');
    return gulp.src(spritePath + '*.svg')
      .pipe(svgmin(function (file) {
        return {
          plugins: [{
            cleanupIDs: {
              minify: true
            }
          }]
        }
      }))
      .pipe(svgstore({ inlineSvg: true }))
      .pipe(cheerio(function ($) {
        $('svg').attr('style',  'display:none')
;      }))
      .pipe(rename('sprite.svg'))
      .pipe(size({
        title: 'Размер',
        showFiles: true,
        showTotal: false,
      }))
      .pipe(gulp.dest('src/img/'))
      .pipe(browserSync.reload({stream: true}));
  }
  else {
    console.log('---------- Сборка SVG спрайта: нет папки с картинками');
    callback();
  }
});
// Собираем html из _html и помещаем в корень
gulp.task('html', function() {
	console.log('---------- c HTML');
	gulp.src('src/_html/*.html')
		.pipe(fileinclude({
			prefix: '@@',
			basepath: '@file',
			indent: true,
		}))
		.pipe(gulp.dest('src/'))
		.pipe(browserSync.reload({stream: true}));
});

// Таск Browser-sync
gulp.task('browser-sync', function() { 
	browserSync({ 
		server: { baseDir: 'src' }, // Директория для сервера - app
		notify: false // Отключаем уведомления
	});
});

// LiveReload
gulp.task('watch', ['browser-sync', 'less'], function() {
	gulp.watch('src/less/**/*.less', ['less']); // Наблюдение за less файлами
	gulp.watch('src/_html/**/*.html', ['html']); // Наблюдение за HTML файлами в корне проекта
	gulp.watch('src/js/*.js', ['js']); // Наблюдение за JS файлами в папке js
	gulp.watch('src/png/*', ['png']); // Наблюдение за PNG файлами в папке png
});

// Очистка перед сборкой
gulp.task('clean', function() {
	console.log('---------- Очистка build');
    return del.sync('build'); // Удаляем папку dist перед сборкой
});

// Сборка в продакшен
// чистим, собираем картинки, собираем html, собираем css, собираем js, собираем библиотеки
gulp.task('build', ['clean', 'img', 'html', 'css', 'js', 'libs'], function() {
	console.log('---------- Сборка');
	
	console.log('---------- Копирование CSS');
    var buildJs = gulp.src('src/css/*.min.css') // Переносим скрипты в продакшен
    .pipe(gulp.dest('build/css'))

	console.log('---------- Копирование JS');
    var buildJs = gulp.src('src/js/*.min.js') // Переносим скрипты в продакшен
    .pipe(gulp.dest('build/js'))

    console.log('---------- Копирование шрифтов');
    var buildFonts = gulp.src('src/fonts/**/*') // Переносим шрифты в продакшен
    .pipe(gulp.dest('build/fonts'))
    
    
	console.log('---------- Копирование HTML');
    var buildHtml = gulp.src('src/*.html') // Переносим HTML в продакшен
    .pipe(replace('main.css', 'main.min.css')) // Подменяем на минифицированные
	.pipe(replace('scripts.js', 'scripts.min.js'))
    .pipe(gulp.dest('build'));

    //gulp.start('ftp');
});

// Проверка существования файла
function fileExist(path) {
  const fs = require('fs');
  try {
    fs.statSync(path);
  } catch(err) {
    return !(err && err.code === 'ENOENT');
  }
}