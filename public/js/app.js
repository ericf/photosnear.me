YUI.add('pnm-app', function (Y) {

var PNM       = Y.PNM,
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
            req.photo = photo;
            next();
            return;
        }

        photo = new Photo(params);
        photo.load(function () {
            // Use the photo's location if we do not have a loaded place.
            if (self.get('place').isNew()) {
                self.set('place', photo.get('location'));
            }

            // Prefer Photo instance already in Photos list.
            req.photo = photos.getById(params.id) || photo;

            next();
        });
    },

    showGrid: function (req) {
        this.showView('grid', {
            photos: req.photos
        }, function (grid) {
            grid.resetUI();
        });
    },

    showLightbox: function (req) {
        this.showView('lightbox', {
            photo : req.photo,
            photos: this.get('photos')
        }, {
            update: true
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
    }

}, {

    ATTRS: {
        place : {valueFn: function () { return new Place(); }},
        photos: {valueFn: function () { return new Photos(); }}
    }

});

Y.namespace('PNM').App = PhotosNearMe;

}, '0.6.0', {
    requires: [
        'app-base',
        'app-content',
        'app-transitions',
        'gallery-geo',
        'pnm-grid-view',
        'pnm-lightbox-view',
        "pnm-no-location-view",
        'pnm-photos',
        'pnm-place',
        'pnm-helpers',
        'pnm-templates'
    ]
});
