// Load environment variables first
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressLayouts = require('express-ejs-layouts');

// Initialize Prisma client
require('./prisma/client');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const apiAuthRouter = require('./routes/api/auth');
const apiVacanciesRouter = require('./routes/api/vacancies');
const apiAdminRouter = require('./routes/api/admin');
const apiMemberRouter = require('./routes/api/member');

// Public Routes (Views)
const publicJobsRouter = require('./routes/public/jobs');
const publicAuthRouter = require('./routes/public/auth');
const publicAdminRouter = require('./routes/public/admin');

// Legacy routes
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// API Routes
app.use('/api/auth', apiAuthRouter);
app.use('/api/vacancies', apiVacanciesRouter);
app.use('/api/admin', apiAdminRouter);
app.use('/api/member', apiMemberRouter);

// Public Routes (Views)
app.use('/jobs', publicJobsRouter);
app.use('/auth', publicAuthRouter);
app.use('/admin', publicAdminRouter);

// Legacy routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
