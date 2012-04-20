var app  = require('./app'),
    port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log('Server listening on ' + port);
});
