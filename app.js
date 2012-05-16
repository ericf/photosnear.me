require('./conf/config');

var connect = require('connect'),
    combo   = require('combohandler'),
    express = require('express'),
    YUI     = require('yui').YUI,

    app    = express.createServer(),
    pubDir = global.config.pubDir,
    Y      = YUI(global.config.yui.server);

// -- YUI config ---------------------------------------------------------------
YUI.namespace('Env.Flickr').API_KEY = global.config.flickr.api_key;
Y.use('parallel', 'pnm-place', 'pnm-photo', 'pnm-photos');

// -- Express config -----------------------------------------------------------
app.configure('development', function () {
    // Gives us pretty logs in development. Must run before other middleware.
    app.use(express.logger(
        '[:date] :req[x-forwarded-for] ":method :url" :status [:response-time ms]'
    ));
});

app.configure(function () {
    // Don't ignore trailing slashes in routes.
    app.set('strict routing', true);

    // Use our custom Handlebars-based view engine as the default.
    app.register('.handlebars', require('./lib/view'));
    app.set('view engine', 'handlebars');

    // Local values that will be shared across all views. Locals specified at
    // render time will override these values if they share the same name.
    app.set('view options', Y.merge(require('./conf/common'), {
        config: global.config
    }));

    // Middleware.
    app.use(express.static(pubDir));
    app.use(express.favicon());
    app.use(app.router);
});

app.configure('development', function () {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack     : true
    }));
});

app.configure('production', function () {
    app.enable('view cache');
    app.use(express.errorHandler());
});

// -- Routes -------------------------------------------------------------------

// Root.
app.get('/', function (req, res) {
    res.render('index', {
        located: false
    });
});

// Combo-handler for JavaScript.
app.get('/combo', combo.combine({rootPath: pubDir + '/js'}), function (req, res) {
    if (connect.utils.conditionalGET(req)) {
        if (!connect.utils.modified(req, res)) {
            return connect.utils.notModified(res);
        }
    }

    res.send(res.body, 200);
});

// Dymanic resource for precompiled templates.
app.get('/templates.js', (function () {
    var uglify = require('uglify-js'),

        precompiled = require('./lib/templates').precompiled,

        templates = [];

    Y.Object.each(precompiled, function (template, name) {
        templates.push({
            name    : name,
            template: template
        });
    });

    return function (req, res) {
        res.render('templates', {
            layout   : false,
            templates: templates
        }, function (err, view) {
            if (err) { return next(); }

            res.send(uglify(view), {'Content-Type': 'application/javascript'}, 200);
        });
    };
}()));

app.get('/places/:id/', function (req, res) {
    var place    = new Y.PNM.Place({id: req.params.id}),
        photos   = new Y.PNM.Photos(),
        requests = new Y.Parallel();

    place.load(requests.add());
    photos.load({place: place}, requests.add());

    requests.done(function () {
        res.render('grid', {
            located: true,

            place: {
                id  : place.get('id'),
                text: place.toString()
            },

            photos: photos.map(function (photo) {
                return photo.getAttrs(['id', 'title', 'thumbUrl']);
            }),

            initialData: {
                place : JSON.stringify(place),
                photos: JSON.stringify(photos)
            },

            initialView: 'grid'
        });
    });
});

app.get('/photos/:id/', function (req, res) {
    var photo = new Y.PNM.Photo({id: req.params.id}),
        place;

    photo.load(function () {
        place = photo.get('location');

        res.render('lightbox', {
            located: true,

            place: {
                id  : place.get('id'),
                text: place.toString()
            },

            photo: Y.merge({title: 'Photo'}, photo.getAttrs([
                'title', 'largeUrl', 'pageUrl'
            ])),

            initialData: {
                place: JSON.stringify(place),
                photo: JSON.stringify(photo)
            },

            initialView: 'lightbox'
        });
    });
});

app.get('/cache/', function (req, res) {
    var caches = {};

    ['Place', 'Photo', 'Photos'].forEach(function (model) {
        var cache = Y.PNM[model].prototype.cache;

        caches[model] = {
            entries: cache.get('size'),
            bytes  : Buffer.byteLength(JSON.stringify(cache.get('entries')))
        };
    });

    res.json(caches);
});

app.del('/cache/', function (req, res) {
    ['Place', 'Photo', 'Photos'].forEach(function (model) {
        Y.PNM[model].prototype.cache.flush();
    });

    res.send('Flushed caches.');
});

app.get('/stats/', function (req, res) {
    res.json({
        uptime: process.uptime(),
        memory: process.memoryUsage()
    })
});

// Catch-all route to dynamically figure out the place based on text.
// **Note:** This needs to be the last route.
app.get('/:place', function (req, res) {
    var place = new Y.PNM.Place();

    place.load({text: req.params.place}, function () {
        if (place.isNew()) {
            return res.send(404);
        }

        res.redirect('/places/' + place.get('id') + '/', 302);
    });
});

module.exports = app;
