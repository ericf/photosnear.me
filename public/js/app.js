YUI.add('pnm-app', function (Y) {

var PNM          = Y.PNM,
    GridView     = PNM.GridView,
    LightboxView = PNM.LightboxView,
    Photo        = PNM.Photo,
    Photos       = PNM.Photos,
    Place        = PNM.Place,
    Templates    = PNM.Templates,
    PhotosNearMe;

PhotosNearMe = Y.Base.create('photosNearMe', Y.App, [], {

    titleTemplate : Templates['title'],
    headerTemplate: Templates['header'],

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
            placeData, content;

        placeData = place.isNew() ? null : {
            id  : place.get('id'),
            text: placeText
        };

        // Update the title of the browser window.
        doc && (doc.title = this.titleTemplate({place: placeData}));

        content = this.headerTemplate({place: placeData});

        container.removeClass('loading').one('#header').setContent(content);
        // Delay adding `located` class so the CSS transitions run.
        place.isNew() || Y.later(1, container, 'addClass', 'located');

        return this;
    },

    locate: function () {
        var self = this;

        Y.Geo.getCurrentPosition(function (res) {
            if (!res.success) {
                self.showNoLocation();
                return;
            }

            var place = new Place(res.coords);
            place.load(function () {
                self.set('place', place);
                self.replace('/places/' + place.get('id') + '/');
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
                // Use the photo's location if we do not have a loaded place.
                if (self.get('place').isNew()) {
                    self.set('place', photo.get('location'));
                }

                photo.loadImg(function () {
                    // Prefer Photo instance already in Photos list.
                    req.photo = photos.getById(params.id) || photo;

                    next();
                });
            });
        }
    },

    showNoLocation: function () {
        var view = new Y.View({
            containerTemplate: '<div id="no-location" />',
            template         : Templates['no-location']
        });

        view.render = function () {
            this.get('container').setContent(this.template());
            return this;
        };

        this.render().showView(view.render());
    },

    showGrid: function (req) {
        this.showView('grid', {
            photos: req.photos
        }, {
            transition: 'fade'
        }, function (grid) {
            grid.reset();
        });
    },

    showLightbox: function (req) {
        var activeView  = this.get('activeView'),
            activePhoto = activeView && activeView.get('photo'),
            photos      = this.get('photos'),
            photo       = req.photo,
            options     = {transition: 'fade'};

        if (activePhoto) {
            if (photos.getNext(photo) === activePhoto) {
                options.transition = 'slideRight';
                options.prepend    = true;
            } else if (photos.getPrev(photo) === activePhoto) {
                options.transition = 'slideLeft';
            }
        }

        this.showView('lightbox', {
            photo : req.photo,
            photos: this.get('photos')
        }, options, function (lightbox) {
            lightbox.fadeInfo();
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
        this.navigate('/photos/' + e.photo.get('id') + '/');
    }

}, {

    ATTRS: {
        place : {value: new Place()},
        photos: {value: new Photos()},

        routes: {
            value: [
                {path: '/', callback: 'locate'},

                {path: '/places/:id/', callback: 'handlePlace'},
                {path: '/places/:id/', callback: 'showGrid'},

                {path: '/photos/:id/', callback: 'handlePhoto'},
                {path: '/photos/:id/', callback: 'showLightbox'}
            ]
        }
    }

});

Y.namespace('PNM').App = PhotosNearMe;

}, '0.5.0', {
    requires: [
        'app-base',
        'app-transitions',
        'gallery-geo',
        'pnm-grid-view',
        'pnm-lightbox-view',
        'pnm-photos',
        'pnm-place',
        'pnm-templates'
    ]
});
