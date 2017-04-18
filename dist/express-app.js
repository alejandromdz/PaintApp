'use strict';
// Include dependencies
var http = require('http');
var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var acceptLanguageParser = require('accept-language-parser');
var passport = require('passport');
var mongoose = require('mongoose');
var errorHandler = require('errorhandler');
var passport_jwt_1 = require('passport-jwt');
var ShareDB = require('sharedb');
var RedisShareDB = require('sharedb-redis-pubsub');
var ShareDBMongo = require('sharedb-mongo');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var IO = require('socket.io');
var models_1 = require('./models');
var routes = require('./routes');
// Main app
var hbs = exphbs.create({});
var dbUrl = 'mongodb://localhost/paint';
var db = mongoose.connect(dbUrl);
var dbShare = ShareDBMongo('mongodb://localhost/paint', { safe: true });
var redisClient = RedisShareDB(6379);
var share = new ShareDB({ db: dbShare, pubsub: redisClient });
var app = express();
exports.app = app;
var server = http.createServer(app);
var wss = new WebSocket.Server({ server: server });
var connection = share.connect();
server.listen(8080);
var users = [];
var io = IO(http.createServer().listen(8081));
io.on('connection', function (socket) {
    socket.on('disconnect', function () {
        console.log('disconnected');
        users.splice(users.indexOf(socket.userId), 1);
        io.sockets.emit('update', users);
    });
    socket.on('login', function (data) {
        socket.userId = data.id;
        users.push(data.id);
        io.sockets.emit('update', users);
    });
});
wss.on('connection', function (ws) {
    var stream = new WebSocketJSONStream(ws);
    share.listen(stream);
});
share.use('doc', function (req, next) {
    var collection = req.collection, id = req.id;
    var doc = connection.get(collection, id);
    doc.fetch(function (err) {
        if (err)
            throw err;
        if (doc.type === null) {
            switch (collection) {
                case 'sessions':
                    doc.create({ commands: [] }, function (err) {
                        if (err)
                            throw err;
                    });
                    break;
                case 'chats':
                    doc.create({ messages: [] }, function (err) {
                        if (err)
                            throw err;
                    });
                    break;
            }
        }
    });
    next();
});
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
// view engine setup
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(errorHandler());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('KKujdsOQiy-M21asVi1Nt-37anqLk6sw-ZXk5j0SXNP'));
app.use(express.static(path.join(__dirname, '/i18n')));
app.use(passport.initialize());
app.use(passport.session());
var cookieExtractor = function (req) {
    var token = null;
    if (req && req.cookies) {
        token = req.cookies['token'];
    }
    return token;
};
var opts = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: 'bu6Jp5QiNN-KDg2Xlb1Gz-Db6Btq9pmn'
};
passport.use(new passport_jwt_1.Strategy(opts, function (jwt_payload, done) {
    models_1.userModel.findOne({ username: jwt_payload.sub }, function (err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            done(null, user);
        }
        else {
            done(null, false);
        }
    });
}));
passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});
passport.deserializeUser(function (id, cb) {
    models_1.userModel.findById(id, function (err, user) {
        if (err) {
            return cb(err, null);
        }
        cb(null, user);
    });
});
app.get('/', function (req, res) {
    var lang;
    if (req.cookies['lang']) {
        lang = req.cookies['lang'];
    }
    else if (req.headers['accept-language']) {
        lang = acceptLanguageParser.parse(req.headers['accept-language'])[0].code;
    }
    switch (lang) {
        case 'en':
            res.redirect('/en');
            break;
        case 'es':
            res.redirect('/es');
            break;
        case 'jp':
            res.redirect('/jp');
            break;
        default:
            res.redirect('/en');
            break;
    }
});
app.get('/en', function (req, res) {
    res.sendFile(path.join(__dirname, '/i18n/en/index.html'));
});
app.get('/es', function (req, res) {
    res.sendFile(path.join(__dirname, '/i18n/es/index.html'));
});
app.get('/jp', function (req, res) {
    res.sendFile(path.join(__dirname, '/i18n/jp/index.html'));
});
app.post('/api/login', routes.login);
app.post('/api/register', routes.register);
app.put('/api/sessions', passport.authenticate('jwt'), routes.createsession);
app.get('/api/self', passport.authenticate('jwt'), routes.self);
app.get('/api/self/request/:id', passport.authenticate('jwt'), routes.sendRequest);
app.get('/api/sessions/:id', passport.authenticate('jwt'), routes.getSessionById);
app.put('/api/sessions/:id', passport.authenticate('jwt'), routes.invite);
app.get('/api/search/:pattern', passport.authenticate('jwt'), routes.searchFriends);
app.get('/get-sandbox', routes.getSandbox);
app.get('/:id', routes.getSharedSession);
app.all('*', function (req, res) {
    res.sendFile(path.join(__dirname, '/404.html'));
});
