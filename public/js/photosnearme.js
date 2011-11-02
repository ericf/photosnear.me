YUI.add('photosnearme', function (Y) {

Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.App, [], {

    titleTemplate : Y.Handlebars.compile(Y.one('#title-template').getContent()),
    headerTemplate: Y.Handlebars.compile(Y.one('#header-template').getContent()),

    views: {
        grid: {
            type    : Y.GridView,
            preserve: true
        },

        lightbox: {
            type  : Y.LightboxView,
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
            this.handleLocate();
        } else {
            this.dispatch();
        }
    },

    render: function () {
        Y.PhotosNearMe.superclass.render.apply(this, arguments);

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
        !place.isNew() && Y.later(1, container, 'addClass', 'located');

        return this;
    },

    handleLocate: function () {
        var self = this;

        Y.Geo.getCurrentPosition(function (res) {
            if (!res.success) {
                // TODO: Show problem View: unable to locate you.
                return;
            }

            var place = new Y.Place(res.coords);
            place.load(function () {
                self.set('place', place);
                self.replace('/place/' + place.get('id') + '/');
            });
        });
    },

    handlePlace: function (req) {
        var placeId = req.params.id,
            place   = this.get('place'),
            photos  = this.get('photos'),
            self    = this;

        if (place.get('id') !== placeId) {
            place = new Y.Place({id: placeId});
            place.load(function () {
                self.set('place', place);
            });
        }

        this.showView('grid', {modelList: photos}, function (gridView) {
            gridView.reset();
        });
    },

    handlePhoto: function (req, res, next) {
        var params = req.params,
            photo  = this.get('photos').getById(params.id),
            self   = this;

        if (photo) {
            req.photo = photo;
            photo.loadImg(function () {
                next();
            });
        } else {
            photo = req.photo = new Y.Photo(params);
            photo.load(function () {
                if (self.get('place').isNew()) {
                    self.set('place', photo.get('place'));
                }

                photo.loadImg(function () {
                    next();
                });
            });
        }
    },

    showLightbox: function (req) {
        var photo  = req.photo,
            photos = this.get('photos');

        this.showView('lightbox', {
            model    : photo,
            modelList: photos
        });
    },

    loadPhotos: function () {
        this.get('photos').load({place: this.get('place')});
    },

    loadMorePhotos: function () {
        var place     = this.get('place'),
            photos    = this.get('photos'),
            newPhotos = new Y.Photos;

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
        place : {value: new Y.Place},
        photos: {value: new Y.Photos},

        routes: {
            value: [
                {path: '/', callback: 'handleLocate'},

                {path: '/place/:id/', callback: 'handlePlace'},

                {path: '/photo/:id/', callback: 'handlePhoto'},
                {path: '/photo/:id/', callback: 'showLightbox'}
            ]
        }
    }

});

}, '0.3.2', {
    requires: [ 'app-base'
              , 'gallery-geo'
              , 'handlebars'
              , 'place'
              , 'photos'
              , 'grid-view'
              , 'lightbox-view'
              ]
});
