var express = require('express'),

    config = require('./conf/config'),
    hbs    = require('./lib/hbs'),
    routes = require('./lib/routes'),

    app = express();

// -- Config -------------------------------------------------------------------

app.set('name', config.name);
app.set('env', config.env);
app.set('port', config.port);

app.engine(hbs.extname, hbs.engine);
app.set('view engine', hbs.extname.substring(1));
app.set('views', config.dirs.views);

app.enable('strict routing');

app.locals({
    flickr     : config.flickr,
    min        : config.env === 'production' ? '-min' : '',
    typekit    : config.typekit,
    yui_config : JSON.stringify(config.yui.client),
    yui_version: config.yui.version
});

// -- Middleware ---------------------------------------------------------------

if (app.get('env') === 'development') {
    app.use(express.logger('tiny'));
}

app.use(express.compress());
app.use(express.favicon());
app.use(express.static(config.dirs.pub));
app.use(express.static(config.dirs.shared));
app.use(app.router);

if (app.get('env') === 'development') {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack     : true
    }));
} else {
    app.use(express.errorHandler());
}

// -- Routes -------------------------------------------------------------------

app.get('/',            routes.index);
app.get('/places/:id/', routes.places);
app.get('/photos/:id/', routes.photos);

app.get('/combo',        routes.combo.pub);
app.get('/shared/combo', routes.combo.shared);
app.get('/templates.js', routes.templates);

// Catch-all route to dynamically figure out the place based on text.
// **Note:** This needs to be the last route.
app.get('/:place', routes.places.lookup('/places/'));

module.exports = app;
