var express = require('express'),
    app     = express.createServer();

app.configure(function(){
    app.use(express.static(__dirname + '/public'));
});

app.get('*', function(req, res){
    res.sendfile('index.html');
});

app.listen(3000);
