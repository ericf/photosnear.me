var express = require('express'),
    combo   = require('combohandler'),

    app    = express.createServer(),
    port   = process.env.PORT || 3000,
    pubDir = __dirname + '/public',
    yuiDir = __dirname + '/../yui/yui3';

app.configure(function () {
    app.use(express.static(pubDir));
});

app.get('/yui', combo.combine({rootPath: yuiDir}), function (req, res) {
    res.send(res.body, 200);
});

app.get('/js', combo.combine({rootPath: pubDir + '/js'}), function (req, res) {
    res.send(res.body, 200);
});

app.get('*', function (req, res) {
    res.sendfile('index.html');
});

app.listen(port, function () {
    console.log('Server listening on ' + port);
});
