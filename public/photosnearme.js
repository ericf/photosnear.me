YUI.add('photosnearme', function(Y){

    var PhotosNearMe,
        
        Place,
        Photo,
        Photos,
        
        LocatingView,
        GridView,
        PhotoView,
        
        YQLSync,
        
        Lang        = Y.Lang
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
        query       : 'SELECT * FROM geo.places WHERE woeid={id}',
        
        parse : function (results) {
            if ( ! results) { return; }
            var data = results.place;
            
            return {
                woeid       : data.woeid,
                country     : data.country.code,
                region      : data.admin1.content,
                locality    : data.locality1.content,
                latitude    : data.centroid.latitude,
                longitude   : data.centroid.longitude
            };
        }
    
    }, {
        ATTRS : {
            woeid       : {},
            country     : {},
            region      : {},
            locality    : {},
            latitude    : {},
            longitude   : {}
        }
    });
    
    // *** Photo *** //
    
    Photo = Y.Base.create('photo', Y.Model, [YQLSync], {
    
        query   : 'SELECT * FROM flickr.photos.info WHERE photo_id={id}',
        imgUrl  : 'http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_{size}.jpg',
        pageUrl : 'http://www.flickr.com/photos/{user}/{id}/',
        
        parse : function (results) {
            if ( ! results) { return; }
            var photo = results.photo,
                place = photo.location;
                
            // TODO handle places with less accuracy (i.e. no region or locality)
                
            photo.place = {
                woeid       : place.woeid,
                country     : place.country.content,
                region      : place.region.content,
                locality    : place.locality.content,
                latitude    : place.latitude,
                longitude   : place.longitude
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
                'WHERE woe_id="{woeid}" AND radius_units="mi" AND sort="interestingness-desc" AND extras="path_alias"',
        
        buildQuery : function (options) {
            return sub(this.query, {
                woeid : options.place.get('id'),
                start : options.start || 0,
                num   : options.num || 100
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
                placeData   = place.isNew() ? null : place.toJSON();
            
            Y.config.doc.title = this.titleTemplate({ place: placeData });
            
            this.container.removeClass('loading')
                .one('#header').setContent(this.headerTemplate({
                    place : placeData
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
            '.photo': { 'click': 'select' },
            '.prev' : { 'click': 'prev' },
            '.next' : { 'click': 'next' }
        },
        
        initializer : function (config) {
            config || (config = {});
            
            var photos = this.photos = config.photos;
            photos.after('refresh', this.render, this);
            photos.after('add', this.addPhoto, this);
            photos.after('remove', this.removePhoto, this);
            
            this.page = config.page;
            
            this.publish('select', { preventable: false });
            this.publish('navigate', { preventable: false });
        },
        
        render : function () {
            var photos  = this.photos,
                page    = this.page,
                prev, next;
                
            if (page === 0) {
                prev = null;
                next = '2/';
            } else if (page === 1) {
                prev = '../';
                next = '../3/';
            } else {
                prev = '../' + page + '/';
                next = '../' + (page + 2) + '/';
            }
            
            this.container.setContent(this.template({
                photos  : photos.toJSON(),
                size    : photos.size(),
                nav     : {
                    prev: prev,
                    next: next
                }
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
        
        select : function (e) {
            e.preventDefault();
            
            var photoNode   = e.currentTarget,
                photoNodes  = this.container.all('.photo'),
                index       = photoNodes.indexOf(photoNode);
            
            photoNodes.filter('.selected').removeClass('selected');
            photoNode.addClass('selected');
            
            this.fire('select', { photo: this.photos.item(index) });
        },
        
        reset : function () {
            this.container.all('.photo.selected').removeClass('selected');
        },
        
        prev : function (e) {
            e.preventDefault();
            this.fire('navigate', { page: this.page });
        },
        
        next : function (e) {
            e.preventDefault();
            this.fire('navigate', { page: this.page + 2 });
        }
    
    });
    
    // *** PhotoView *** //
    
    PhotoView = Y.Base.create('photoView', Y.View, [], {
    
        container   : '<div id="lightbox" />',
        template    : Handlebars.compile(Y.one('#lightbox-template').getContent()),
        events      : {
            '.show-photos' : { 'click': 'showPhotos' }
        },
        
        initializer : function (config) {
            config || (config = {});
            
            this.place = config.place;
            this.publish('showPhotos', { preventable: false });
        },
        
        render : function () {
            var photo = this.model;
            
            this.container.setContent(this.template({
                place       : this.place.toJSON(),
                title       : photo.get('title') || 'Photo',
                description : photo.get('description') || '',
                largeUrl    : photo.get('largeUrl')
            }));
            
            return this;
        },
               
        showPhotos : function (e) {
            e.preventDefault();
            this.fire('showPhotos');
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
            this.publish('select', { preventable: false });
            this.publish('locate', { preventable: false });
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
            
            var center = this.map.getCenter();
            this.fire('select', { coords: {
                latitude    : center.lat(),
                longitude   : center.lng()
            }});
        },
        
        locate : function (e) {
            e.preventDefault();
            this.fire('locate');
        }
    
    });
    
    // *** PhotosNearMe *** //
    
    PhotosNearMe = Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.Controller, [], {
    
        routes : [
            { path: '/',                callback: 'handleLocate' },
            { path: '/place/:id/*page', callback: 'handlePlace' },
            { path: '/photo/:id/',      callback: 'handlePhoto' }
        ],
        
        queries : {
            woeid : 'SELECT place.woeid FROM flickr.places WHERE lat={latitude} AND lon={longitude}'
        },
        
        initializer : function () {
            this.place      = new Place();
            this.photos     = new Photos();
            this.appView    = new AppView({ place: this.place });
            
            this.after('photosPageChange', this.loadPhotos);
            
            this.place.after('idChange', Y.bind(this.place.load, this.place));
            
            this.appView.on('showMap', this.showMap, this);
            
            this.on('gridView:select', function(e){
                this.save('/photo/' + e.photo.get('id') + '/');
            });
            this.on('gridView:navigate', function(e){
                this.save('/place/' + this.place.get('id') + '/' + e.page + '/');
            });
            
            this.on('photoView:showPhotos', Y.bind(function(e){
                var place = this.place.isNew() ? e.target.model.get('place') : this.place;
                this.save('/place/' + place.get('id') + '/');
            }, this));
            
            this.on('mapView:select', Y.bind(function(e){
                e.target.remove();
                this.navigatePlace(e.coords);
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
                
                this.navigatePlace(res.coords);
            }, this));
        },
        
        handlePlace : function (req) {
            var params  = req.params,
                page    = (parseInt(params.page, 10) || 1) - 1;
            
            // redirect to clear crufty URL
            if (params.page && page <= 0) {
                return this.replace('/place/' + params.id + '/');
            }
            
            this.place.set('id', params.id);
            this.set('photosPage', page);
            this.showGridView();
        },
        
        handlePhoto : function (req) {
            var photo = this.photos.getById(req.params.id) || new Photo(req.params);
            
            photo.load(Y.bind(function(){
                photo.loadImg(Y.bind(this.showPhotoView, this, photo));
            }, this));
        },
        
        navigatePlace : function (coords) {
            Y.YQL(sub(this.queries.woeid, coords), Y.bind(function(r){
                var place = r.query && r.query.results ? r.query.results.places.place : null;
                if (place) {
                    this.replace('/place/' + place.woeid + '/');
                } else {
                    // TODO: Show problem View: unable to locate you.
                }
            }, this));
        },
        
        loadPhotos : function () {
            var photosPage  = this.get('photosPage'),
                gridView    = this.gridView;
                
            if (gridView) {
                gridView.page = photosPage;
                gridView.render();
            }
            
            this.photos.load({
                place : this.place,
                start : photosPage * 100
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
                    page            : this.get('photosPage'),
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
                bubbleTargets   : this
            }).render();
            
            appView.render().container.one('#main').setContent(this.photoView.container);
            this.hideUrlBar();
        },
        
        showMap : function () {
            var place   = this.place,
                map     = this.map,
                mapView = this.mapView;
                
            if ( ! map) {
                map = this.map = new google.maps.Map(Y.config.doc.createElement('div'), {
                    zoom        : 15,
                    mapTypeId   : google.maps.MapTypeId.ROADMAP
                });
            }
            
            if ( ! mapView) {
                mapView = this.mapView = new MapView({
                    map             : map,
                    bubbleTargets   : this
                }).render();
            }
            
            map.setCenter(new google.maps.LatLng(place.get('latitude'), place.get('longitude')));
            this.appView.container.append(mapView.container);
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
    
    }, {
    
        ATTRS : {
            photosPage : { validator: isNumber }
        }
    
    });

}, '0.2.0', { requires: ['app', 'yql', 'cache-offline', 'gallery-geo'] });
