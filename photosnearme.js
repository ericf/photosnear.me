YUI.add('photosnearme', function(Y){

    var Photo,
        Photos,
        Place,
        
        LocatingView,
        GridView,
        PhotoView,
        
        PhotosNearMe,
        
        Lang    = Y.Lang
        sub     = Lang.sub;
    
    // *** Place *** //
    
    Place = Y.Base.create('place', Y.Model, [], {
    
        idAttribute : 'woeid',
        query       : 'SELECT * FROM geo.places WHERE woeid={woeid}',
        
        sync : function (action, options, callback) {
            if (action !== 'read') { return callback(null); }
            Y.YQL(sub(this.query, this.toJSON()), function(r){
                if (r.error) {
                    callback(r.error, r);
                } else {
                    callback(null, r.query.results);
                }
            });
        },
        
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
    
    // *** PhotosNearMe *** //
    
    PhotosNearMe = Y.PhotosNearMe = Y.Base.create('photosNearMe', Y.Controller, [], {
    
        // *** Prototype *** //
        
        base : '/~eferraiuolo/photosnear.me',
        
        routes : [
            { path: '/',                callback: 'locate' },
            { path: '/woeid/:woeid/',   callback: 'fetchPhotos' },
            { path: '/photo/:photo/',   callback: 'showPhoto' }
        ],
        
        titles : {
            location : 'Photos Near: {locality}, {admin} {country}'
        },
        
        queries : {
            woeid : 'SELECT place.woeid FROM flickr.places WHERE lat={latitude} AND lon={longitude}'
        },
        
        locate : function (req) {
            // TODO show LocatingView
            
            Y.Geo.getCurrentPosition(Y.bind(function(res){
                if ( ! res.success) {
                    // TODO update LocatingView: can't locate you
                    return;
                }
                
                Y.YQL(sub(this.queries.woeid, res.coords), Y.bind(function(r){
                    var place = new Place(r.query && r.query.results ? r.query.results.places.place : null);
                    place.load(Y.bind(function(){
                        var placeData = place.toJSON();
                        this.replace('/woeid/' + placeData.woeid + '/', null, placeData);
                        Y.config.doc.title = sub(this.titles.location, placeData);
                    }, this));
                }, this));
            }, this));
        },
        
        fetchPhotos : function (req) {
            var place = new Place(req.state || req.params);
            console.log(place.toJSON());
        },
        
        showPhoto : function (req) {}
    
    }, {});

}, '0.1.0', { requires: ['app', 'yql', 'gallery-geo'] });
