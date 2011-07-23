YUI.add('photosnearme', function(Y){

    var PhotosNearMe,
        
        Place,
        Photo,
        Photos,
        
        AppView,
        LocatingView,
        GridView,
        PhotoView,
        MapView,
        
        YQLSync,
        
        Lang        = Y.Lang
        sub         = Lang.sub,
        isString    = Lang.isString,
        isNumber    = Lang.isNumber,
        isFunction  = Lang.isFunction;
    
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
            
            // return cached results if we got ’em
            if (results) { return callback(null, results.response); }
            
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
            placeFromId         : 'SELECT * FROM geo.places WHERE woeid={id}',
            placeFromCentroid   : 'SELECT * FROM geo.places WHERE woeid in ' +
                                  '(SELECT place.woeid FROM flickr.places WHERE lat={latitude} AND lon={longitude})',
            placeFromBoundingBox: 'SELECT * FROM geo.places.common WHERE woeid1={southWest} AND woeid2={northEast}'
        },
        
        buildQuery : function () {
            var centroid, boundingBox;
            
            if ( ! this.isNew()) {
                return sub(this.queries.placeFromId, { id: this.get('id') });
            }
            
            centroid = this.get('centroid');
            if (centroid) {
                return sub(this.queries.placeFromCentroid, centroid);
            }
            
            boundingBox = this.get('boundingBox');
            if (boundingBox) {
                // assumes a boundingBox object with woeids not lat/lons.
                return sub(this.queries.placeFromBoundingBox, boundingBox);
            }
        },
        
        parse : function (results) {
            if ( ! results) { return; }
            var data        = results.place,
                country     = data.country,
                region      = data.admin1,
                locality    = data.locality1;
            
            return {
                woeid       : data.woeid,
                centroid    : data.centroid,
                boundingBox : data.boundingBox,
                country     : country && country.content,
                region      : region && region.content,
                locality    : locality && locality.content
            };
        },
        
        toString : function () {
            var country     = this.get('country'),
                region      = this.get('region'),
                locality    = this.get('locality');
            
            if (locality) { return (locality + ', ' + region); }
            if (region) { return (region + ', ' + country); }
            return country || '';
        }
    
    }, {
        ATTRS : {
            woeid       : {},
            centroid    : {},
            boundingBox : {},
            country     : {},
            region      : {},
            locality    : {}
        },
        
        getCommonPlace : function (boundingBox, callback) {
            var sw = new Place({ centroid: boundingBox.southWest }),
                ne = new Place({ centroid: boundingBox.northEast });
            
            sw.load(function(){
                ne.load(function(){
                    var place = new Place({
                        boundingBox : {
                            southWest : sw.get('id'),
                            northEast : ne.get('id')
                        }
                    });
                    
                    place.load(function(){
                        isFunction(callback) && callback(place);
                    });
                });
            });
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
                centroid    : {
                    latitude    : place.latitude,
                    longitude   : place.longitude,
                },
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
                'WHERE bbox="{minLon},{minLat},{maxLon},{maxLat}" ' +
                'AND sort="interestingness-desc" AND extras="path_alias" AND min_taken_date="1/1/1970"',
        
        buildQuery : function (options) {
            options || (options = {});
            
            var bounds  = options.place.get('boundingBox'),
                sw      = bounds.southWest,
                ne      = bounds.northEast;
            
            return sub(this.query, {
                start : options.start || 0,
                num   : options.num || 100,
                minLon: Math.min(sw.longitude, ne.longitude),
                maxLon: Math.max(sw.longitude, ne.longitude),
                minLat: Math.min(sw.latitude, ne.latitude),
                maxLat: Math.max(sw.latitude, ne.latitude),
            });
        },
        
        parse : function (results) {
            return results ? results.photo : null;
        }
    
    });
    
    // *** AppView *** //
    
    AppView = Y.Base.create('appView', Y.View, [], {
        
        container       : Y.one('#wrap'),
        titleTemplate   : Handlebars.compile(Y.one('#title-template').getContent()),
        headerTemplate  : Handlebars.compile(Y.one('#header-template').getContent()),
        events          : {
            '.show-map' : { 'click': 'showMap' }
        },
        
        initializer : function (config) {
            config || (config = {});
            
            this.place = config.place;
            this.place.after('change', this.render, this);
            
            this.publish('showMap', { preventable: false });
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
        },
        
        showMap : function (e) {
            e.preventDefault();
            this.fire('showMap');
        }
    
    });
    
    // *** GridView *** //
    
    GridView = Y.Base.create('gridView', Y.View, [], {
    
        container       : '<div id="photos" />',
        template        : Handlebars.compile(Y.one('#grid-template').getContent()),
        photoTemplate   : Handlebars.compile(Y.one('#grid-photo-template').getContent()),
        events          : {
            '.photo': { 'click': 'select' }
        },
        
        initializer : function (config) {
            config || (config = {});
            
            var photos = this.photos = config.photos;
            photos.after('refresh', this.render, this);
            photos.after('add', this.addPhoto, this);
            photos.after('remove', this.removePhoto, this);
            
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
            
            return this;
        },
        
        addPhoto : function (e) {
            var content = this.photoTemplate(e.model.toJSON()),
                list    = this.container.one('ul');
            
            list.insert(content, list.all('.photo').item(e.index));
        },
        
        removePhoto : function (e) {
            this.container.all('.photo').splice(e.index, 1);
        },
        
        more : function (e) {
            var viewportBottom  = Y.DOM.viewportRegion().bottom,
                maxKnowHeight   = this._maxKnownHeight,
                containerBottom;
                
            if (viewportBottom <= maxKnowHeight) { return; }
            
            containerBottom = this.container.get('region').bottom;
                
            if ((viewportBottom + 100) > containerBottom && containerBottom > maxKnowHeight) {
                this._maxKnownHeight = containerBottom;
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
                nav, prev, next;
                
            if ( ! this.photos.isEmpty()) {
                nav     = {};
                prev    = this.getPrev();
                next    = this.getNext();
                
                prev && (nav.prev = '../' + prev.get('id') + '/');
                next && (nav.next = '../' + next.get('id') + '/');
            }
            
            this.container.setContent(this.template({
                place       : this.place.toJSON(),
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
    
    // *** MapView *** //
    
    MapView = Y.Base.create('mapView', Y.View, [], {
    
        container   : '<div id="map" />',
        template    : Handlebars.compile(Y.one('#map-template').getContent()),
        events      : {
            '.close'    : { click: 'close' },
            '.select'   : { click: 'select' },
            '.current'  : { click: 'locate' },
        },
        
        initializer : function (config) {
            config || (config = {});
            this.map = config.map;
            
            this.publish({
                select : { preventable: false },
                locate : { preventable: false }
            });
        },
        
        render : function () {
            var container = this.container;
            container.setContent(this.template());
            Y.one(this.map.getDiv()).addClass('map').appendTo(container);
            return this;
        },
        
        close : function (e) {
            e.preventDefault();
            this.remove();
        },
        
        select : function (e) {
            e.preventDefault();
            this.fire('select');
        },
        
        locate : function (e) {
            e.preventDefault();
            this.fire('locate');
        }
    
    });
    
    // *** PhotosNearMe *** //
    
    PhotosNearMe = Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.Controller, [], {
    
        routes : [
            { path: '/',                        callback: 'handleLocate' },
            { path: '/place/:id/',              callback: 'handlePlace' },
            { path: '/place/:id/region/:bbox/', callback: 'handlePlace' },
            { path: '/photo/:id/',              callback: 'handlePhoto' }
        ],
        
        initializer : function () {
            this.place      = new Place();
            this.photos     = new Photos();
            this.appView    = new AppView({ place: this.place });
            
            this.place.after('boundingBoxChange', this.loadPhotos, this);
            
            this.appView.on('showMap', this.showMap, this);
            
            this.on('gridView:more', this.morePhotos, this);
            this.on(['gridView:select', 'photoView:navigate'], function(e){
                this.save('/photo/' + e.photo.get('id') + '/');
            });
            
            this.on('photoView:showPhotos', Y.bind(function(e){
                // Use the photo's place when the app starts on a photo page
                var place = this.place.isNew() ? e.target.model.get('place') : this.place;
                this.save('/place/' + place.get('id') + '/');
            }, this));
            
            this.on('mapView:select', Y.bind(function(e){
                var mapView = e.target,
                    bounds  = mapView.map.getBounds(),
                    sw      = bounds.getSouthWest(),
                    ne      = bounds.getNorthEast(),
                    boundingBox, place;
                    
                boundingBox = {
                    southWest : {
                        latitude    : sw.lat(),
                        longitude   : sw.lng()
                    },
                    northEast : {
                        latitude    : ne.lat(),
                        longitude   : ne.lng()
                    }
                };
                
                Place.getCommonPlace(boundingBox, Y.bind(function(place){
                    mapView.remove();
                    this.navigatePlace(place, bounds.toUrlValue());
                }, this));
            }, this));
            
            this.on('mapView:locate', this.updateMap, this);
            
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
                
                this.navigatePlace(new Place({ centroid: res.coords }), null, true);
            }, this));
        },
        
        handlePlace : function (req) {
            var params  = req.params,
                place   = this.place,
                region, boundingBox;
            
            if (params.bbox) {
                region = params.bbox.split(',');
                boundingBox = {
                    southWest : {
                        latitude    : region[0],
                        longitude   : region[1]
                    },
                    northEast : {
                        latitude    : region[2],
                        longitude   : region[3]
                    }
                };
                
                place.set('boundingBox', boundingBox);
            }
            
            if (place.get('id') !== params.id) {
                if (boundingBox) {
                    // we already set our special boundingBox
                    place.once('boundingBoxChange', function(e){
                        e.preventDefault();
                    });
                }
                
                place.set('id', params.id).load();
            }
            
            this.showGridView();
        },
        
        handlePhoto : function (req) {
            var photo = this.photos.getById(req.params.id) || new Photo(req.params);
            
            photo.load(Y.bind(function(){
                photo.loadImg(Y.bind(this.showPhotoView, this, photo));
            }, this));
        },
        
        navigatePlace : function (place, region, replace) {
            var navigate = Y.bind(function(err){
                if (err) {
                    // TODO: Show problem View: unable to find location.
                    return;
                }
                
                var url = '/place/' + place.get('id') + '/';
                if (region) {
                    url += 'region/' + region + '/';
                }
                
                this[!!replace ? 'replace' : 'save'](url);
            }, this);
            
            if (place.isNew()) {
                place.load(navigate);
            } else {
                navigate();
            }
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
            }, Y.bind(function(){
                photos.add(newPhotos.toArray());
                newPhotos.destroy();
            }, this));
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
        
        showMap : function () {
            var place   = this.place,
                center  = place.get('centroid'),
                bbox    = place.get('boundingBox'),
                sw      = bbox.southWest,
                ne      = bbox.northEast,
                map     = this.map,
                mapView = this.mapView;
                
            if ( ! map) {
                map = this.map = new google.maps.Map(Y.config.doc.createElement('div'), {
                    zoom        : 14,
                    mapTypeId   : google.maps.MapTypeId.ROADMAP
                });
                
                map.fitBounds(new google.maps.LatLngBounds(
                    new google.maps.LatLng(sw.latitude, sw.longitude),
                    new google.maps.LatLng(ne.latitude, ne.longitude)
                ));
            }
            
            if ( ! mapView) {
                mapView = this.mapView = new MapView({
                    map             : map,
                    bubbleTargets   : this
                }).render();
            }
            
            //map.setCenter(new google.maps.LatLng(center.latitude, center.longitude));
            
            this.appView.container.one('#map-container').append(mapView.container);
        },
        
        updateMap : function () {
            var map = this.map;
            if ( ! map) { return; }
            
            Y.Geo.getCurrentPosition(function(res){
                if ( ! res.success) { return; }
                var coords = res.coords;
                map.setCenter(new google.maps.LatLng(coords.latitude, coords.longitude));
            });
        },
        
        hideUrlBar : Y.UA.ios && ! Y.UA.ipad ? function(){
            setTimeout(function(){
                Y.config.win.scrollTo(0, 1);
            }, 1);
        } : function(){}
    
    });

}, '0.2.0', {
    requires: ['app'
              ,'yql'
              ,'cache-offline'
              ,'gallery-geo'
              ,'transition'
              ,'event-flick'
              ,'node-screen'
              ]
});
