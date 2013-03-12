YUI.add('pnm-app', function (Y) {

var PNM     = Y.PNM,
    PNMEnv  = YUI.namespace('Env.PNM'),
    PNMData = YUI.namespace('Env.PNM.DATA'),

    Photo     = PNM.Photo,
    Photos    = PNM.Photos,
    Place     = PNM.Place,
    Templates = PNM.Templates,
    PhotosNearMe;

PhotosNearMe = Y.Base.create('photosNearMe', Y.App, [], {

    titleTemplate : Templates['title'],
    headerTemplate: Templates['header'],

    namedRoutes: [
        {name: 'index',  callbacks: 'locate'},
        {name: 'places', callbacks: ['handlePlace', 'showGrid']},
        {name: 'photos', callbacks: ['handlePhoto', 'showLightbox']}
    ],

    views: {
        grid: {
            type    : 'PNM.GridView',
            preserve: true
        },

        lightbox: {
            type    : 'PNM.LightboxView',
            parent  : 'grid',
            preserve: true
        },

        noLocation: {
            type    : 'PNM.NoLocationView',
            preserve: true
        }
    },

    transitions: {
        navigate: 'fade',
        toChild : 'fade',
        toParent: 'fade'
    },

    initializer: function () {
        this.after('placeChange', this.render);
        this.after('placeChange', this.loadPhotos);

        this.on('gridView:more', this.loadMorePhotos);

        this.on('lightboxView:prev', this.navigateToPhoto);
        this.on('lightboxView:next', this.navigateToPhoto);
    },

    render: function (options) {
        PhotosNearMe.superclass.render.apply(this, arguments);

        options = (options || {});

        var container, content, doc, place, placeData, placeText;

        // No need to re-render the initial server rendering.
        if (options.rendered) { return this; }

        doc       = Y.config.doc;
        container = this.get('container');
        place     = this.get('place');
        placeText = place.toString();

        placeData = place.isNew() ? null : {
            id  : place.get('id'),
            text: placeText
        };

        doc.title = this.titleTemplate({place: placeData});
        content   = this.headerTemplate({place: placeData});

        container.removeClass('loading').one('#header').setHTML(content);
        // Delay adding `located` class so the CSS transitions run.
        if (!place.isNew()) {
            Y.later(0, container, 'addClass', 'located');
        }

        return this;
    },

    locate: function () {
        var self = this;

        Y.Geo.getCurrentPosition(function (res) {
            if (!res.success) {
                return self.render().showView('noLocation');
            }

            var place = new Place(res.coords);
            place.load(function () {
                self.set('place', place);
                self.navigateToRoute('places', place, {replace: true});
            });
        });
    },

    handlePlace: function (req, res, next) {
        var self    = this,
            place   = self.get('place'),
            placeId = req.params.id;

        if (place.get('id') !== placeId) {
            place = new Place({id: placeId});
            place.load(function () {
                self.set('place', place);
            });
        }

        req.place  = place;
        req.photos = self.get('photos');

        next();
    },

    handlePhoto: function (req, res, next) {
        var params = req.params,
            photos = this.get('photos'),
            photo  = photos.getById(params.id),
            self   = this;

        if (photo) {
            req.photo = photos.revive(photo);
            next();
            return;
        }

        photo = new Photo(params);
        photo.load(function () {
            var photoPlace = photo.get('location');

            // Use the photo's location if the app does not have a loaded place,
            // or the photo doesn't have a location.
            if (self.get('place').isNew() || photoPlace.isNew()) {
                self.set('place', photoPlace);
            }

            // Prefer Photo instance already in Photos list.
            req.photo = photos.getById(params.id) || photo;

            next();
        });
    },

    showGrid: function (req) {
        var rendered = this.get('viewContainer').one('.grid'),
            config   = {photos: req.photos};

        if (rendered) {
            this.showContent(rendered, {
                view: {
                    name  : 'grid',
                    config: config
                },

                transition: false
            });
        } else {
            this.showView('grid', config, function (grid) {
                grid.resetUI();
            });
        }
    },

    showLightbox: function (req) {
        var rendered = this.get('viewContainer').one('.lightbox'),
            config;

        config = {
            photo : req.photo,
            photos: this.get('photos')
        };

        if (rendered) {
            this.showContent(rendered, {
                view: {
                    name  : 'lightbox',
                    config: config
                },

                update    : true,
                transition: false
            });
        } else {
            this.showView('lightbox', config, {update: true});
        }
    },

    loadPhotos: function () {
        this.get('photos').load({place: this.get('place')});
    },

    loadMorePhotos: function () {
        var place     = this.get('place'),
            photos    = this.get('photos'),
            newPhotos = new Photos();

        newPhotos.load({
            place: place,
            start: photos.size()
        }, function () {
            photos.add(newPhotos);

            // Clean up temp ModelList.
            newPhotos.destroy();
        });
    },

    navigateToRoute: function (routeName, context, options) {
        var path = Y.PNM.Helpers.pathTo(routeName, context);
        if (!path) { return false; }
        return this.navigate(path, options);
    },

    navigateToPhoto: function (e) {
        this.navigateToRoute('photos', e.photo);
    },

    rehydrateData: function (key) {
        var data = PNMData[key];

        if (typeof data === 'string') {
            try {
                data = Y.JSON.parse(data);
            } catch (ex) {
                data = null;
            }
        }

        return data;
    }

}, {

    ATTRS: {
        place : {
            valueFn: function () {
                return new Place(this.rehydrateData('place'));
            }
        },

        photos: {
            valueFn: function () {
                return new Photos({items: this.rehydrateData('photos')});
            }
        }
    }

});

Y.namespace('PNM').App = PhotosNearMe;

}, '0.7.2', {
    requires: [
        'app-base',
        'app-content',
        'app-transitions',
        'gallery-geo',
        'json-parse',
        'pnm-grid-view',
        'pnm-lightbox-view',
        "pnm-no-location-view",
        'pnm-photos',
        'pnm-place',
        'pnm-helpers',
        'pnm-templates'
    ]
});
