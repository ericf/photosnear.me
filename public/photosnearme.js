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
        isString    = Lang.isString;
    
    // *** Handlebars Partials *** //
    
    Handlebars.registerPartial('header', Y.one('#header-template').getContent());
    
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
                woeid   : data.woeid,
                country : data.country.code,
                region  : data.admin1.content,
                locality: data.locality1.content
            };
        }
    
    }, {
        ATTRS : {
            woeid   : {},
            country : {},
            region  : {},
            locality: {}
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
                woeid   : place.woeid,
                country : place.country.content,
                region  : place.region.content,
                locality: place.locality.content
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
    
    // *** LocatingView *** //
    
    LocatingView = Y.Base.create('locatingView', Y.View, [], {
    
        container   : Y.one('#content'),
        template    : Handlebars.compile(Y.one('#locating-template').getContent()),
        
        render : function () {
            this.container.setContent(this.template({ place: null }));
            return this;
        }
    
    });
    
    // *** GridView *** //
    
    GridView = Y.Base.create('gridView', Y.View, [], {
    
        container       : '<div id="photos" />',
        template        : Handlebars.compile(Y.one('#grid-template').getContent()),
        photosTemplate  : Handlebars.compile(Y.one('#grid-photos-template').getContent()),
        events          : {
            '.photo' : { 'click': 'select' }
        },
        
        initializer : function (config) {
            config || (config = {});
            
            this.place  = config.place;
            this.photos = config.photos;
            
            this.publish('select', { preventable: false });
            
            this.photos.after(['refresh', 'add', 'remove'], this.render, this);
            this.photos.after('refresh', this.refresh, this);
        },
        
        render : function () {
            this.container.setContent(this.template({
                place   : this.place.toJSON(),
                size    : this.photos.size()
            }));
            
            Y.later(1, this, function(){
                this.container.addClass('located');
            });
            
            return this;
        },
        
        refresh : function (e) {
            var photosData = Y.Array.map(e.models, function(photo){ return photo.toJSON(); });
            this.container.append(this.photosTemplate({ photos: photosData }));
        },
        
        select : function (e) {
            e.preventDefault();
            
            var index = this.container.all('.photo').indexOf(e.currentTarget);
            this.fire('select', { photo: this.photos.item(index) });
        }
    
    });
    
    // *** PhotoView *** //
    
    PhotoView = Y.Base.create('photoView', Y.View, [], {
    
        container   : '<div id="lightbox" />',
        template    : Handlebars.compile(Y.one('#lightbox-template').getContent()),
        events      : {
            '.back' : { 'click': 'back' }
        },
        
        initializer : function (config) {
            config || (config = {});
            this.place = config.place;
            this.place.after('change', Y.bind(this.render, this));
            
            this.publish('back', { preventable: false });
        },
        
        render : function () {
            var photo = this.model;
            
            this.container.addClass('located').setContent(this.template({
                title       : photo.get('title') || 'Photo',
                description : photo.get('description') || '',
                largeUrl    : photo.get('largeUrl'),
                place       : this.place.toJSON()
            }));
            
            return this;
        },
               
        back : function (e) {
            e.preventDefault();
            this.fire('back', { place : this.place });
        }
    
    });
    
    // *** PhotosNearMe *** //
    
    PhotosNearMe = Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.Controller, [], {
    
        dispatchOnInit : true,
        
        routes : [
            { path: '/',            callback: 'locate' },
            { path: '/place/:id/',  callback: 'showPlace' },
            { path: '/photo/:id/',  callback: 'showPhoto' }
        ],
        
        titles : {
            place   : 'Photos Near: {locality}, {region} {country}',
            photo   : 'Photo: {title}'
        },
        
        queries : {
            woeid : 'SELECT place.woeid FROM flickr.places WHERE lat={latitude} AND lon={longitude}'
        },
        
        place   : null,
        photos  : null,
        
        initializer : function () {
            this.place  = new Place();
            this.photos = new Photos();
            
            this.on('gridView:select', function(e){
                this.save('/photo/' + e.photo.get('id') + '/');
            });
            
            this.on('photoView:back', function(e){
                this.save('/place/' + e.place.get('id') + '/');
            });
        },
        
        locate : function (req) {
            new LocatingView().render();
            
            Y.Geo.getCurrentPosition(Y.bind(function(res){
                if ( ! res.success) {
                    // TODO update LocatingView: can't locate you
                    return;
                }
                
                Y.YQL(sub(this.queries.woeid, res.coords), Y.bind(function(r){
                    var placeData = r.query && r.query.results ? r.query.results.places.place : {}
                    this.replace('/place/' + placeData.woeid + '/');
                }, this));
            }, this));
        },
        
        showPlace : function (req) {
            var place       = this.place,
                photos      = this.photos
                photoView   = this.photoView,
                gridView    = this.gridView;
                       
            if (photoView) {
                photoView.removeTarget(this);
                photoView.destroy();
            }
            
            if (place.isNew()) {
                place.setAttrs(req.params).load(Y.bind(function(){
                    gridView = this.gridView = new GridView({
                        place           : place,
                        photos          : photos,
                        bubbleTargets   : this
                    }).render();
                    
                    Y.config.doc.title = sub(this.titles.place, place.toJSON());
                    Y.one('#content').setContent(gridView.container);
                }, this));
                
                this.photos.load({ place: place });
            } else if (gridView) {
                Y.config.doc.title = sub(this.titles.place, place.toJSON());
                Y.one('#content').setContent(gridView.container);
            }
        },
        
        showPhoto : function (req) {
            var photo = this.photos.getById(req.params.id) || new Photo(req.params);
            
            photo.load(Y.bind(function(){
                Y.config.doc.title = sub(this.titles.photo, { title: photo.get('title') });
                
                // use the photo’s place if we don’t already have a place
                var place = this.place.isNew() ? photo.get('place') : this.place;
                
                this.photoView = new PhotoView({
                    model           : photo,
                    place           : place,
                    bubbleTargets   : this
                }).render();
                
                if (this.gridView) {
                    // retrain rendered grid
                    this.gridView.remove();
                    this.photoView.container.appendTo('#content');
                } else {
                    // started on photo page
                    Y.one('#content').setContent(this.photoView.container);
                }
            }, this));
        }
    
    });

}, '0.2.0', { requires: ['app', 'yql', 'cache-offline', 'gallery-geo'] });
