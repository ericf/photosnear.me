YUI.add('photosnearme', function(Y){

    var Photo,
        Photos,
        Place,
        
        LocatingView,
        GridView,
        PhotoView,
        
        PhotosNearMe,
        
        YQLSync,
        
        Lang        = Y.Lang
        sub         = Lang.sub,
        isString    = Lang.isString;
    
    // *** YQLSync *** //
    
    YQLSync = function(){};
    YQLSync.prototype = {
    
        query : '',
        
        buildQuery : function () {
            return sub(this.query, { id: this.get('id') });
        },
        
        sync : function (action, options, callback) {
            if (action !== 'read') { return callback(null); }
            
            Y.YQL(this.buildQuery(options), Y.bind(function(r){
                if (r.error) {
                    callback(r.error, r);
                } else {
                    callback(null, r.query.results);
                }
            }, this));
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
                admin   : data.admin1.content,
                locality: data.locality1.content
            };
        }
    
    }, {
        ATTRS : {
            woeid   : {},
            country : {},
            admin   : {},
            locality: {}
        }
    });
    
    // *** Photo *** //
    
    Photo = Y.Base.create('photo', Y.Model, [YQLSync], {
    
        query   : 'SELECT * FROM flickr.photos.info WHERE photo_id={id}',
        imgUrl  : 'http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_{size}.jpg',
        pageUrl : 'http://www.flickr.com/photos/{user}/{id}/',
        
        parse : function (response) {
            var photo = response.photo;
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
            thumbUrl    : {
                getter : function(){
                    return this.getImgUrl('s');
                }
            },
            largeUrl    : {
                getter : function(){
                    return this.getImgUrl('b');
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
                'WHERE woe_id="{woeid}" AND radius_units="mi" AND sort="interestingness-desc"',
        
        buildQuery : function (options) {
            return sub(this.query, {
                woeid : options.place.get('id'),
                start : options.start || 0,
                num   : options.num || 100
            });
        },
        
        parse : function (results) {
            return results.photo;
        }
    
    });
    
    // *** LocatingView *** //
    
    LocatingView = Y.Base.create('locatingView', Y.View, [], {
    
        container   : Y.one('#content'),
        template    : '<p>Locating you…</p>',
        
        render : function () {
            this.container.setContent(this.template);
            
            return this;
        }
    
    });
    
    // *** GridView *** //
    
    GridView = Y.Base.create('gridView', Y.View, [], {
    
        container       : Y.one('#content'),
        template        : '<h1>Photos Near: {locality}, {admin}, {country}</h1><p>Photos: {size}</p><ul id="photos"></ul>',
        photoTemplate   : '<li><img src="{thumbUrl}" /></li>',
        
        initializer : function (config) {
            config || (config = {});
            
            this.place  = config.place;
            this.photos = config.photos;
            
            this.photos.after(['refresh', 'add', 'remove'], this.render, this);
            this.photos.after('refresh', this.refresh, this);
        },
        
        render : function () {
            var place = this.place;
            this.container.setContent(sub(this.template, {
                locality: place.get('locality'),
                admin   : place.get('admin'),
                country : place.get('country'),
                size    : this.photos.size()
            }));
            
            return this;
        },
        
        refresh : function (e) {
            var fragment        = Y.one(Y.config.doc.createDocumentFragment()),
                photoTemplate   = this.photoTemplate;
    
            Y.Array.each(e.models, function (model) {
                fragment.append(sub(photoTemplate, model.toJSON()));
            });
    
            this.container.one('#photos').setContent(fragment);
        }
    
    });
    
    // *** PhotoView *** //
    
    PhotoView = Y.Base.create('photoView', Y.View, [], {
    
        container   : Y.one('#content'),
        template    : '<p>Photo…</p>',
        
        render : function () {
            this.container.setContent(this.template);
            
            return this;
        }
    
    });
    
    // *** PhotosNearMe *** //
    
    PhotosNearMe = Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.Controller, [], {
    
        routes : [
            { path: '/',            callback: 'locate' },
            { path: '/place/:id/',  callback: 'showPlace' },
            { path: '/photo/:id/',  callback: 'showPhoto' }
        ],
        
        titles : {
            place : 'Photos Near: {locality}, {admin} {country}'
        },
        
        queries : {
            woeid : 'SELECT place.woeid FROM flickr.places WHERE lat={latitude} AND lon={longitude}'
        },
        
        place   : null,
        photos  : null,
        
        initializer : function () {
            this.place  = new Place();
            this.photos = new Photos();
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
                    this.replace('/place/' + placeData.woeid + '/', placeData);
                }, this));
            }, this));
        },
        
        showPlace : function (req) {
            var place   = this.place,
                photos  = this.photos;
            
            if (place.isNew()) {
                place.setAttrs(req.params).load(Y.bind(function(){
                    Y.config.doc.title = sub(this.titles.place, place.toJSON());
                    new GridView({ place: place, photos: photos }).render();
                }, this));
                this.photos.load({ place: place });
            } else {
                new GridView({ place: place, photos: photos }).render();
            }            
        },
        
        showPhoto : function (req) {}
    
    });

}, '0.1.0', { requires: ['app', 'yql', 'gallery-geo'] });
