var express = require('express'),
    app     = express.createServer(),
    port    = 8001;

app.configure(function () {
    app.use(express.static(__dirname + '/public'));
});

app.get('*', function (req, res) {
    res.sendfile('index.html');
});

app.listen(port);
console.log('Server running at http://localhost:' + port + '/');
