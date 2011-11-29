var express = require('express'),
    combo   = require('combohandler'),

    app    = express.createServer(),
    port   = process.env.PORT || 3000,
    pubDir = __dirname + '/public';

app.configure(function () {
    app.use(express.static(pubDir));
});

// Combo-handler for JavaScript.
app.get('/js', combo.combine({rootPath: pubDir + '/js'}), function (req, res) {
    res.send(res.body, 200);
});

// Restrict to only known paths that the app can respond to:
// "/"
// "/place/:id/"
// "/photo/:id/"
app.get(/^\/(?:(?:place|photo)\/\d+\/)?$/, function (req, res) {
    res.sendfile('index.html');
});

app.listen(port, function () {
    console.log('Server listening on ' + port);
});
