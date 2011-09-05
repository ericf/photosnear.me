var express = require('express'),
    app     = express.createServer(),
    port    = process.env.PORT || 3000;

app.configure(function () {
    app.use(express.static(__dirname + '/public'));
});

app.get('*', function (req, res) {
    res.sendfile('index.html');
});

app.listen(port, function () {
    console.log('Server listening on ' + port);
});
