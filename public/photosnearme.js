YUI.add('photosnearme', function(Y){

    var PhotosNearMe,

        Place,
        Photo,
        Photos,

        AppView,
        GridView,
        PhotoView,

        YQLSync,

        Lang        = Y.Lang,
        sub         = Lang.sub,
        isString    = Lang.isString,
        isNumber    = Lang.isNumber;

    // *** YQLSync *** //

    YQLSync = function(){};
    YQLSync.prototype = {

        query : '',
        cache : new Y.CacheOffline,

        buildQuery : function () {
            return sub(this.query, { id: this.get('id') });
        },

        sync : function (action, options, callback) {
            if (action !== 'read') { return callback(null); }

            var query   = this.buildQuery(options),
                cache   = this.cache,
                results = cache.retrieve(query);

            if (results) {
                // return cached results if we got ’em
                return callback(null, results.response);
            }

            Y.YQL(query, function(r){
                if (r.error) {
                    callback(r.error, r);
                } else {
                    results = r.query.results;
                    cache.add(query, results);
                    callback(null, results);
                }
            });
        }

    };

    // *** Place *** //

    Place = Y.Base.create('place', Y.Model, [YQLSync], {

        idAttribute : 'woeid',
        queries     : {
            placeFromId     : 'SELECT * FROM geo.places WHERE woeid={id}',
            placeFromLatLon : 'SELECT * FROM geo.places WHERE woeid ' +
                              'IN (SELECT place.woeid FROM flickr.places WHERE lat={latitude} AND lon={longitude})'
        },

        buildQuery : function () {
            if (this.isNew()) {
                // assumes we at least have a lat/lon
                return sub(this.queries.placeFromLatLon, {
                    latitude    : this.get('latitude'),
                    longitude   : this.get('longitude')
                });
            }

            return sub(this.queries.placeFromId, { id: this.get('id') });
        },

        parse : function (results) {
            if ( ! results) { return; }
            var data        = results.place,
                centroid    = data.centroid,
                country     = data.country,
                region      = data.admin1,
                locality    = data.locality1;

            return {
                woeid       : data.woeid,
                latitude    : centroid.latitude,
                longitude   : centroid.longitude,
                country     : country && country.content,
                region      : region && region.content,
                locality    : locality && locality.content
            };
        },

        toString : function () {
            var country     = this.get('country'),
                region      = this.get('region'),
                locality    = this.get('locality');

            if (locality) {
                return (locality + ', ' + region);
            }

            if (region) {
                return (region + ', ' + country);
            }

            return country || '';
        }

    }, {
        ATTRS : {
            woeid       : {},
            latitude    : {},
            longitude   : {},
            country     : {},
            region      : {},
            locality    : {}
        }
    });

    // *** Photo *** //

    Photo = Y.Base.create('photo', Y.Model, [YQLSync], {

        query   : 'SELECT * FROM flickr.photos.info WHERE photo_id={id}',
        imgUrl  : 'http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_{size}.jpg',
        pageUrl : 'http://www.flickr.com/photos/{user}/{id}/',

        parse : function (results) {
            if ( ! results) { return; }
            var photo       = results.photo,
                place       = photo.location,
                country     = place.country,
                region      = place.region,
                locality    = place.locality;

            photo.place = {
                woeid       : place.woeid,
                latitude    : place.latitude,
                longitude   : place.longitude,
                country     : country && country.content,
                region      : region && region.content,
                locality    : locality && locality.content
            };

            return photo;
        },

        getImgUrl : function (size) {
            return sub(this.imgUrl, {
                id      : this.get('id'),
                farm    : this.get('farm'),
                server  : this.get('server'),
                secret  : this.get('secret'),
                size    : size
            });
        },

        loadImg : function (callback) {
            // insired by: Lucas Smith (http://lucassmith.name/2008/11/is-my-image-loaded.html)

            var img     = new Image(),
                prop    = img.naturalWidth ? 'naturalWidth' : 'width';

            img.src = this.get('largeUrl');

            if (img.complete) {
                callback.call(this, img[prop] ? img : null);
            } else {
                img.onload = Y.bind(callback, this, img);
                img.onerror = Y.bind(callback, this, null);
            }
        }

    }, {
        ATTRS : {
            farm        : {},
            server      : {},
            secret      : {},
            owner       : {},
            pathalias   : {},
            title       : {},
            description : {},
            place       : {
                value   : {},
                setter  : function (place) {
                    return ((place instanceof Place) ? place : new Place(place));
                }
            },
            thumbUrl    : {
                getter : function(){
                    return this.getImgUrl('s');
                }
            },
            largeUrl    : {
                getter : function(){
                    return this.getImgUrl('z');
                }
            },
            pageUrl     : {
                getter : function(){
                    var user = this.get('pathalias') || this.get('owner');
                    return sub(this.pageUrl, {
                        id  : this.get('id'),
                        user: isString(user) ? user : user.nsid
                    });
                }
            }
        }
    });

    // *** Photos *** //

    Photos = Y.Base.create('photos', Y.ModelList, [YQLSync], {

        model : Photo,
        query : 'SELECT * FROM flickr.photos.search({start},{num}) ' +
                'WHERE woe_id={woeid} AND sort="interestingness-desc" AND extras="path_alias"',

        buildQuery : function (options) {
            options || (options = {});

            return sub(this.query, {
                start : options.start || 0,
                num   : options.num || 100,
                woeid : options.place.get('id')
            });
        },

        parse : function (results) {
            return results ? results.photo : [];
        }

    });

    // *** AppView *** //

    AppView = Y.Base.create('appView', Y.View, [], {

        container       : Y.one('#wrap'),
        titleTemplate   : Handlebars.compile(Y.one('#title-template').getContent()),
        headerTemplate  : Handlebars.compile(Y.one('#header-template').getContent()),

        initializer : function (config) {
            config || (config = {});

            this.place = config.place;
            this.place.after('change', this.render, this);
        },

        render : function () {
            var place       = this.place,
                placeText   = place.toString();

            Y.config.doc.title = this.titleTemplate({ place: placeText });

            this.container.removeClass('loading')
                .one('#header').setContent(this.headerTemplate({
                    place : placeText
                }));

            if ( ! place.isNew()) {
                Y.later(1, this, function(){
                    this.container.addClass('located');
                });
            }

            return this;
        }

    });

    // *** GridView *** //

    GridView = Y.Base.create('gridView', Y.View, [], {

        container       : '<div id="photos" />',
        template        : Handlebars.compile(Y.one('#grid-template').getContent()),
        photoTemplate   : Handlebars.compile(Y.one('#grid-photo-template').getContent()),
        events          : {
            '.photo' : { 'click': 'select' }
        },

        initializer : function (config) {
            config || (config = {});

            var photos = this.photos = config.photos;
            photos.after('reset', this.render, this);
            photos.after('add', this.addPhoto, this);
            photos.after('remove', this.removePhoto, this);
            photos.after(['add', 'remove'], this.updateSize, this);

            this.loadingNode = null;

            this.publish({
                more    : { preventable: false },
                select  : { preventable: false }
            });

            this._maxKnownHeight = 0;

            Y.one('win').on(['scroll', 'resize'], this.more, this);
        },

        render : function () {
            var photos  = this.photos,
                size    = photos.size();

            this.container.setContent(this.template({
                photos  : photos.toJSON(),
                size    : size
            }, {
                partials: { photo: this.photoTemplate }
            }));

            this.loadingNode = this.container.one('.loading');

            return this;
        },

        addPhoto : function (e) {
            var container   = this.container,
                content     = this.photoTemplate(e.model.toJSON()),
                list        = container.one('ul');

            this.loadingNode.hide();
            list.insert(content, list.all('.photo').item(e.index));
        },

        removePhoto : function (e) {
            this.container.all('.photo').splice(e.index, 1);
        },

        updateSize : function (e) {
            this.container.one('size').set('text', this.photos.size());
        },

        more : function (e) {
            var viewportBottom  = Y.DOM.viewportRegion().bottom,
                maxKnowHeight   = this._maxKnownHeight,
                containerBottom;

            if (viewportBottom <= maxKnowHeight) { return; }

            containerBottom = this.container.get('region').bottom;

            if ((viewportBottom + 150) > containerBottom && containerBottom > maxKnowHeight) {
                this._maxKnownHeight = containerBottom;
                this.loadingNode.show();
                this.fire('more');
            }
        },

        select : function (e) {
            e.preventDefault();

            var photoNode   = e.currentTarget,
                photoNodes  = this.container.all('.photo'),
                index       = photoNodes.indexOf(photoNode);

            photoNodes.removeClass('selected');
            photoNode.addClass('selected');

            this.fire('select', { photo: this.photos.item(index) });
        },

        reset : function () {
            this._maxKnownHeight = 0;
            this.container.all('.photo.selected').removeClass('selected');
        }

    });

    // *** PhotoView *** //

    PhotoView = Y.Base.create('photoView', Y.View, [], {

        container   : '<div id="lightbox" />',
        template    : Handlebars.compile(Y.one('#lightbox-template').getContent()),
        events      : {
            '.show-photos'  : { 'click': 'showPhotos' },
            '.prev'         : { 'click': 'prev' },
            '.next'         : { 'click': 'next' }
        },

        initializer : function (config) {
            config || (config = {});

            this.place  = config.place;
            this.photos = config.photos;

            this.publish({
                navigate    : { preventable: false },
                showPhotos  : { preventable: false }
            });

            // TODO: should I keep this?
            this.container.on('flick', Y.bind(function(e){
                var distance = e.flick.distance;
                if (distance > 0) {
                    this.prev(e);
                } else {
                    this.next(e);
                }
            }, this), {
                axis        : 'x',
                minDistance : 100
            });
        },

        render : function () {
            var photo = this.model,
                place = this.place,
                nav, prev, next;

            if ( ! this.photos.isEmpty()) {
                nav     = {};
                prev    = this.getPrev();
                next    = this.getNext();

                prev && (nav.prev = '../' + prev.get('id') + '/');
                next && (nav.next = '../' + next.get('id') + '/');
            }

            this.container.setContent(this.template({
                placeId     : place.get('id'),
                placeText   : place.toString(),
                title       : photo.get('title') || 'Photo',
                description : photo.get('description') || '',
                largeUrl    : photo.get('largeUrl'),
                nav         : nav
            }));

            return this;
        },

        showPhotos : function (e) {
            e.preventDefault();
            this.fire('showPhotos');
        },

        getPrev : function () {
            var photos  = this.photos,
                photo   = photos.getById(this.model.get('id'));

            return photo && photos.item( photos.indexOf(photo) - 1 );
        },

        getNext : function () {
            var photos  = this.photos,
                photo   = photos.getById(this.model.get('id'));

            return photo && photos.item( photos.indexOf(photo) + 1 );
        },

        prev : function (e) {
            e.preventDefault();
            var photo = this.getPrev();
            if (photo) {
                this.fire('navigate', { photo: photo });
            }
        },

        next : function (e) {
            e.preventDefault();
            var photo = this.getNext();
            if (photo) {
                this.fire('navigate', { photo: photo });
            }
        }

    });

    // *** PhotosNearMe *** //

    PhotosNearMe = Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.Controller, [], {

        routes : [
            { path: '/',            callback: 'handleLocate' },
            { path: '/place/:id/',  callback: 'handlePlace' },
            { path: '/photo/:id/',  callback: 'handlePhoto' }
        ],

        initializer : function () {
            this.place      = new Place();
            this.photos     = new Photos();
            this.appView    = new AppView({ place: this.place });
            this.gridView   = null;
            this.photoView  = null;

            this.place.after('idChange', this.place.load);
            this.place.after('idChange', this.loadPhotos, this);

            this.on('gridView:more', this.morePhotos);

            this.on(['gridView:select', 'photoView:navigate'], function(e){
                this.navigatePhoto(e.photo);
            });

            this.on('photoView:showPhotos', function(e){
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

        handleLocate : function (req) {
            this.hideUrlBar();

            Y.Geo.getCurrentPosition(Y.bind(function(res){
                if ( ! res.success) {
                    // TODO: Show problem View: unable to locate you.
                    return;
                }

                this.navigatePlace(new Place(res.coords), true);
            }, this));
        },

        handlePlace : function (req) {
            this.place.set('id', req.params.id);
            this.showGridView();
        },

        handlePhoto : function (req) {
            var photo = this.photos.getById(req.params.id) || new Photo(req.params);
            photo.load(Y.bind(function(){
                photo.loadImg(Y.bind(this.showPhotoView, this, photo));
            }, this));
        },

        navigatePlace : function (place, replace) {
            var navigate = Y.bind(function(err){
                if (err) {
                    // TODO: Show problem View: unable to find location.
                    return;
                }

                this[!!replace ? 'replace' : 'save']('/place/' + place.get('id') + '/');
            }, this);

            if (place.isNew()) {
                place.load(navigate);
            } else {
                navigate();
            }
        },

        navigatePhoto : function (photo, replace) {
            var url = '/photo/' + photo.get('id') + '/';
            this[!!replace ? 'replace' : 'save'](url);
        },

        loadPhotos : function () {
            this.photos.load({ place: this.place });
        },

        morePhotos : function () {
            var photos      = this.photos,
                newPhotos   = new Photos();

            newPhotos.load({
                place : this.place,
                start : photos.size()
            }, function(){
                var allPhotos = photos.toArray().concat(newPhotos.toArray());
                photos.reset(allPhotos);
                // clean up temp ModelList
                newPhotos.destroy();
            });
        },

        showGridView : function () {
            var appView     = this.appView,
                gridView    = this.gridView;

            if (this.photoView) {
                this.photoView.destroy().removeTarget(this);
                this.photoView = null;
            }

            if ( ! gridView) {
                gridView = this.gridView = new GridView({
                    photos          : this.photos,
                    bubbleTargets   : this
                }).render();
            }

            gridView.reset();
            appView.render().container.one('#main').setContent(gridView.container);
            this.hideUrlBar();
        },

        showPhotoView : function (photo) {
            var appView     = this.appView,
                gridView    = this.gridView,
                place       = this.place;

            // retain rendered GirdView
            if (gridView) {
                gridView.remove();
            }

            // use the photo’s place data if we don’t already have a place
            if (place.isNew()) {
                place.setAttrs(photo.get('place').toJSON());
            }

            this.photoView = new PhotoView({
                model           : photo,
                place           : place,
                photos          : this.photos,
                bubbleTargets   : this
            }).render();

            appView.render().container.one('#main').setContent(this.photoView.container);
            this.hideUrlBar();
        },

        hideUrlBar : Y.UA.ios && ! Y.UA.ipad ? function(){
            Y.later(1, Y.config.win, function(){
                this.scrollTo(0, 1);
            });
        } : function(){}

    });

}, '0.3.0', {
    requires: ['app'
              ,'yql'
              ,'cache-offline'
              ,'gallery-geo'
              ,'transition'
              ,'event-flick'
              ,'node-screen'
              ]
});
