'use strict';
var express_app_1 = require('./express-app');
var port = process.env.PORT || 3000;
express_app_1.app.set('port', port);
express_app_1.app.listen(express_app_1.app.get('port'), function () {
    console.log('Application running at localhost:' + express_app_1.app.get('port'));
}).on('error', function (err) {
    console.log('Cannot start server, port most likely in use');
    console.log(err);
});
