var express = require('express'),
    expose  = require('express-expose'),
    yui     = require('yui'),

    PNM_ENV = yui.YUI.namespace('Env.PNM'),

    config = require('./conf/config'),
    app, hbs, middleware, routes, exposedRoutes;

// -- Configure YUI ------------------------------------------------------------

// Applies config to shared YUI instance.
yui.getInstance().applyConfig(config.yui.server);

PNM_ENV.CACHE  = config.cache.server;
PNM_ENV.FLICKR = config.flickr;

// -- Configure App ------------------------------------------------------------

app = express();
hbs = require('./lib/hbs');

app.set('name', config.name);
app.set('env', config.env);
app.set('port', config.port);

app.engine(hbs.extname, hbs.engine);
app.set('view engine', hbs.extname.substring(1));
app.set('views', config.dirs.views);

app.enable('strict routing');

app.expose(config.cache.client, 'YUI.Env.PNM.CACHE', 'pnm_env');
app.expose(config.flickr, 'YUI.Env.PNM.FLICKR', 'pnm_env');

app.locals({
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

middleware    = require('./lib/middleware');
routes        = require('./lib/routes');
exposedRoutes = {};

function exposeRoute(name) {
    var args = [].slice.call(arguments, 1),
        routes, route;

    app.get.apply(app, args);

    routes = app.routes.get;
    route  = routes[routes.length -1];

    exposedRoutes[name] = {
        path : route.path,
        keys : route.keys,
        regex: route.regexp.toString()
    };
}

exposeRoute('index',  '/', routes.index);

exposeRoute('places', '/places/:id/', [
    routes.places.load,
    middleware.exposeData('place', 'photos'),
    middleware.exposeView('grid'),
    routes.places.render
]);

exposeRoute('photos', '/photos/:id/', [
    routes.photos.load,
    middleware.exposeData('place', 'photo'),
    middleware.exposeView('lightbox'),
    routes.photos.render
]);

app.get('/combo',        routes.combo.pub);
app.get('/shared/combo', routes.combo.shared);
app.get('/templates.js', routes.templates);

// Catch-all route to dynamically figure out the place based on text.
// **Note:** This needs to be the last route.
app.get('/:place', routes.places.lookup('/places/'));

PNM_ENV.ROUTES = exposedRoutes;
app.expose(exposedRoutes, 'YUI.Env.PNM.ROUTES', 'pnm_env');

// -- Exports ------------------------------------------------------------------

module.exports = app;
