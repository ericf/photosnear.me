var app    = require('./app'),
    config = require('./conf/config');

app.listen(config.port, function () {
    console.log(config.name + ' Server listening on ' + config.port);
});
