YUI.add('photosnearme', function (Y) {

Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.Controller, [], {

    routes: [
        { path: '/',            callback: 'handleLocate' },
        { path: '/place/:id/',  callback: 'handlePlace' },
        { path: '/photo/:id/',  callback: 'handlePhoto' }
    ],

    initializer: function () {
        this.place        = new Y.Place();
        this.photos       = new Y.Photos();
        this.appView      = new Y.AppView({ place: this.place });
        this.gridView     = null;
        this.lightboxView = null;

        this.place.after('idChange', this.place.load);
        this.place.after('idChange', this.loadPhotos, this);

        this.on('gridView:more', this.morePhotos);

        this.on(['gridView:select', 'lightboxView:navigate'], function (e) {
            this.navigatePhoto(e.photo);
        });

        this.on('lightboxView:showPhotos', function (e) {
            // Use the photo's place when the app starts on a photo page
            var place = this.place.isNew() ? e.target.model.get('place') : this.place;
            this.navigatePlace(place);
        });

        // do initial dispatch
        if (window.navigator.standalone) {
            // iOS saved to home screen,
            // always route to / so geolocation lookup is preformed.
            this.replace('/');
        } else {
            this.dispatch();
        }
    },

    handleLocate: function (req) {
        this.appView.hideUrlBar();

        Y.Geo.getCurrentPosition(Y.bind(function (res) {
            if ( ! res.success) {
                // TODO: Show problem View: unable to locate you.
                return;
            }

            this.navigatePlace(new Y.Place(res.coords), true);
        }, this));
    },

    handlePlace: function (req) {
        this.place.set('id', req.params.id);
        this.showGridView();
    },

    handlePhoto: function (req) {
        var photo = this.photos.getById(req.params.id) || new Y.Photo(req.params);
        photo.load(Y.bind(function () {
            photo.loadImg(Y.bind(this.showLightboxView, this, photo));
        }, this));
    },

    navigatePlace: function (place, replace) {
        var navMethod = Y.bind(!!replace ? 'replace' : 'save', this);

        function navigate (err) {
            if (err) {
                // TODO: Show problem View: unable to find location.
                return;
            }

            navMethod('/place/' + place.get('id') + '/');
        }

        if (place.isNew()) {
            place.load(navigate);
        } else {
            navigate();
        }
    },

    navigatePhoto: function (photo, replace) {
        var url = '/photo/' + photo.get('id') + '/';
        this[!!replace ? 'replace' : 'save'](url);
    },

    loadPhotos: function () {
        this.photos.load({ place: this.place });
    },

    morePhotos: function () {
        var photos    = this.photos,
            newPhotos = new Y.Photos();

        newPhotos.load({
            place: this.place,
            start: photos.size()
        }, function () {
            var allPhotos = photos.toArray().concat(newPhotos.toArray());
            photos.reset(allPhotos);
            // clean up temp ModelList
            newPhotos.destroy();
        });
    },

    showGridView: function () {
        var appView  = this.appView,
            gridView = this.gridView;

        function destroyLightbox () {
            if (this.lightboxView) {
                this.lightboxView.destroy().removeTarget(this);
                this.lightboxView = null;
            }
        }

        if ( ! gridView) {
            gridView = this.gridView = new Y.GridView({
                photos       : this.photos,
                bubbleTargets: this
            }).render();
        }

        appView.set('pageView', gridView.reset(), {
            callback: Y.bind(destroyLightbox, this)
        });

        appView.hideUrlBar();
    },

    showLightboxView: function (photo) {
        var appView = this.appView,
            place   = this.place;

        // use the photo’s place data if we don’t already have a place
        if (place.isNew()) {
            place.setAttrs(photo.get('place').toJSON());
        }

        this.lightboxView = new Y.LightboxView({
            model        : photo,
            place        : place,
            photos       : this.photos,
            bubbleTargets: this
        });

        appView.set('pageView', this.lightboxView.render());
        appView.hideUrlBar();
    }

});

}, '0.3.2', {
    requires: [ 'controller'
              , 'gallery-geo'
              , 'place'
              , 'photos'
              , 'app-view'
              , 'grid-view'
              , 'lightbox-view'
              ]
});
