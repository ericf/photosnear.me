var express           = require('express'),
    expmap            = require('express-map'),
    expstate          = require('express-state'),
    expyui            = require('express-yui'),
    Locator           = require('locator'),
    LocatorHandlebars = require('locator-handlebars'),

    config  = require('./conf/config'),
    app, isDevelopment, middleware, routes, exposedRoutes, locator;

// -- Configure App ------------------------------------------------------------

app = express();

expstate.extend(app);
expmap.extend(app);
expyui.extend(app);

app.set('name', config.name);
app.set('env', config.env);
app.set('port', config.port);
app.set('view', app.yui.view({defaultLayout: 'main'}));
app.set('state namespace', 'PNM');

app.enable('strict routing');

app.expose({}, 'DATA');
app.expose(config.cache.client, 'CACHE');
app.expose(config.flickr, 'FLICKR');

app.locals({
    typekit: config.typekit
});

isDevelopment = isDevelopment;

// -- Configure YUI ------------------------------------------------------------

// Global PNM env config.
global.PNM = {};
PNM.CACHE  = config.cache.server;
PNM.FLICKR = config.flickr;

// -- Middleware -----------------------------------------------------------

middleware = require('./middleware');

if (isDevelopment) {
    app.use(express.logger('tiny'));
}

app.use(express.compress());
app.use(express.favicon());
app.use(expyui.expose());

if (isDevelopment) {
    app.yui.setCoreFromAppOrigin();
    app.use(expyui.debug({filter: 'raw'}));
}

app.use(app.router);
app.use(middleware.slash());
app.use(expyui.static());
app.use(express.static(config.dirs.pub));
app.use(middleware.placeLookup('/places/'));

if (isDevelopment) {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack     : true
    }));
} else {
    app.use(express.errorHandler());
}

// -- Routes -------------------------------------------------------------------

routes = require('./routes');

function mapRoute(name, path, callbacks) {
    app.get(path, callbacks);
    app.map(path, name);
}

mapRoute('index', '/', routes.index);

mapRoute('places', '/places/:id/', [
    routes.places.load,
    routes.places.render
]);

mapRoute('photos', '/photos/:id/', [
    routes.photos.load,
    routes.photos.render
]);

PNM.ROUTES = {routes: app.getRouteMap()};
app.exposeRoutes('ROUTES');

// -- Locator and plugins ------------------------------------------------------

locator = new Locator({buildDirectory: 'build'})
    .plug(LocatorHandlebars.yui())
    .plug(app.yui.plugin({
        registerGroup        : true,
        registerServerModules: true
    }));

locator.parseBundle(__dirname, {}).then(function () {
    app.yui.use('pnm-helpers');
    app.emit('ready');
}, function (err) {
    console.error(err);
    console.error(err.stack);
});

// -- Exports ------------------------------------------------------------------

module.exports = app;
