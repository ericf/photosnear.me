YUI.add('pnm-app', function (Y) {

var Photo  = Y.PNM.Photo,
    Photos = Y.PNM.Photos,
    Place  = Y.PNM.Place,

    Helpers   = Y.PNM.Helpers,
    Templates = Y.Template._cache,

    PhotosNearMe;

// Register template helpers.
Y.Object.each(Helpers, function (helper, name) {
    Y.Handlebars.registerHelper(name, helper);
});

// Define App.
PhotosNearMe = Y.Base.create('photosNearMe', Y.App, [], {

    titleTemplate : Templates['photosnearme/title'],
    headerTemplate: Templates['photosnearme/header'],

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
        var path = Helpers.pathTo(routeName, context);
        if (!path) { return false; }
        return this.navigate(path, options);
    },

    navigateToPhoto: function (e) {
        this.navigateToRoute('photos', e.photo);
    }

}, {

    ATTRS: {
        place : {
            valueFn: function () {
                return new Place(PNM.DATA.place);
            }
        },

        photos: {
            valueFn: function () {
                return new Photos({items: PNM.DATA.photos});
            }
        }
    }

});

Y.PNM.App = PhotosNearMe;

}, '0.11.0', {
    affinity: 'client',
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
        'photosnearme-templates-title',
        'photosnearme-templates-header'
    ]
});
