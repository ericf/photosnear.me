YUI.add('pnm-app', function (Y) {

var PNM          = Y.PNM,
    GridView     = PNM.GridView,
    LightboxView = PNM.LightboxView,
    Photo        = PNM.Photo,
    Photos       = PNM.Photos,
    Place        = PNM.Place,
    PhotosNearMe;

PhotosNearMe = Y.Base.create('photosNearMe', Y.App, [], {

    titleTemplate : Y.Handlebars.compile(Y.one('#title-template').getContent()),
    headerTemplate: Y.Handlebars.compile(Y.one('#header-template').getContent()),

    views: {
        grid: {
            type    : GridView,
            preserve: true
        },

        lightbox: {
            type  : LightboxView,
            parent: 'grid'
        }
    },

    initializer: function () {
        this.after('placeChange', this.render);
        this.after('placeChange', this.loadPhotos);

        this.on('gridView:more', this.loadMorePhotos);

        this.on(['lightboxView:prev', 'lightboxView:next'], this.navigateToPhoto);

        // Do initial dispatch.
        if (Y.config.win.navigator.standalone) {
            // iOS saved to home screen,
            // always route to / so geolocation lookup is preformed.
            this.locate();
        } else {
            this.dispatch();
        }
    },

    render: function () {
        PhotosNearMe.superclass.render.apply(this, arguments);

        var place     = this.get('place'),
            placeText = place.toString(),
            container = this.get('container'),
            doc       = Y.config.doc,
            content;

        // Update the title of the browser window.
        doc && (doc.title = this.titleTemplate({place: placeText}));

        content = this.headerTemplate({
            place: place.isNew() ? null : {
                id  : place.get('id'),
                text: placeText
            }
        });

        container.removeClass('loading').one('#header').setContent(content);
        // Delay adding `located` class so the CSS transitions run.
        place.isNew() || Y.later(1, container, 'addClass', 'located');

        return this;
    },

    locate: function () {
        var self = this;

        Y.Geo.getCurrentPosition(function (res) {
            if (!res.success) {
                // TODO: Show problem View: unable to locate you.
                return;
            }

            var place = new Place(res.coords);
            place.load(function () {
                self.set('place', place);
                self.replace('/place/' + place.get('id') + '/');
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
            photo.loadImg(function () {
                req.photo = photo;
                next();
            });
        } else {
            photo = new Photo(params);
            photo.load(function () {
                // Use the photo's place if we do not have a loaded place.
                if (self.get('place').isNew()) {
                    self.set('place', photo.get('place'));
                }

                photo.loadImg(function () {
                    // Prefer Photo instance already in Photos list.
                    req.photo = photos.getById(params.id) || photo;

                    next();
                });
            });
        }
    },

    showGrid: function (req) {
        this.showView('grid', {
            photos: req.photos
        }, function (grid) {
            grid.reset();
        });
    },

    showLightbox: function (req) {
        this.showView('lightbox', {
            photo : req.photo,
            photos: this.get('photos')
        });
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
            var allPhotos = photos.toArray().concat(newPhotos.toArray());
            photos.reset(allPhotos);
            // clean up temp ModelList
            newPhotos.destroy();
        });
    },

    navigateToPhoto: function (e) {
        this.navigate('/photo/' + e.photo.get('id') + '/');
    }

}, {

    ATTRS: {
        place : {value: new Place()},
        photos: {value: new Photos()},

        routes: {
            value: [
                {path: '/', callback: 'locate'},

                {path: '/place/:id/', callback: 'handlePlace'},
                {path: '/place/:id/', callback: 'showGrid'},

                {path: '/photo/:id/', callback: 'handlePhoto'},
                {path: '/photo/:id/', callback: 'showLightbox'}
            ]
        }
    }

});

Y.namespace('PNM').App = PhotosNearMe;

}, '0.4.1', {
    requires: [ 'app-base'
              , 'gallery-geo'
              , 'handlebars'
              , 'pnm-grid-view'
              , 'pnm-lightbox-view'
              , 'pnm-photos'
              , 'pnm-place'
              ]
});
