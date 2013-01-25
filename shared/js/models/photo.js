YUI.add('pnm-photo', function (Y) {

var PNM_ENV = YUI.namespace('Env.PNM'),

    Lang  = Y.Lang,
    Place = Y.PNM.Place,
    Photo, cache;

// Create model cache. Server uses a strict maximum number of entries which is
// not a supported attribute by `CacheOffline`.
if ('max' in PNM_ENV.CACHE.photo) {
    cache = new Y.Cache(PNM_ENV.CACHE.photo);
} else {
    cache = new Y.CacheOffline(PNM_ENV.CACHE.photo);
}

Photo = Y.Base.create('photo', Y.Model, [Y.ModelSync.YQL], {

    cache    : cache,
    query    : 'SELECT {attrs} FROM flickr.photos.info WHERE api_key={api_key} AND photo_id={id}',
    imgURL   : 'http://farm{farm}.static.flickr.com/{server}/{id}_{secret}_{size}.jpg',
    htmlURL  : 'http://www.flickr.com/photo.gne?id={id}',
    thumbSize: 'q',
    largeSize: 'z',

    buildQuery: function () {
        return Lang.sub(this.query, {
            api_key: PNM_ENV.FLICKR.api_key || '',
            id     : this.get('id'),
            attrs  : Photo.YQL_ATTRS
        });
    },

    parse: function (results) {
        if (!results) { return; }

        // Support being called as a utility or parsing a YQL response.
        var photo = 'photo' in results ? results.photo : results;

        return Y.mix({
            id      : photo.id,
            title   : photo.title,
            location: this.parseLocation(photo)
        }, this.parseURLs(photo));
    },

    parseLocation: function (photoData) {
        var location = photoData && photoData.location,
            country, region, locality;

        if (!location) { return null; }

        country  = location.country;
        region   = location.region;
        locality = location.locality;

        return  {
            woeid    : location.woeid,
            latitude : location.latitude,
            longitude: location.longitude,
            country  : country && country.content,
            region   : region && region.content,
            locality : locality && locality.content
        };
    },

    parseURLs: function (photoData) {
        if (!photoData) { return null; }

        var imgURL  = this.imgURL,
            pageURL = photoData.urls && photoData.urls.url,
            thumbURL, largeURL;

        if (Lang.isArray(pageURL)) {
            pageURL = Y.Array.find(pageURL, function (url) {
                return url && url.type === 'photopage';
            });
        }

        pageURL = pageURL && pageURL.type === 'photopage' ?
                pageURL.content : Lang.sub(this.htmlURL, photoData);

        thumbURL = Lang.sub(imgURL, Y.merge(photoData, {size: this.thumbSize}));
        largeURL = Lang.sub(imgURL, Y.merge(photoData, {size: this.largeSize}));

        if (this.largeSize === 'z') {
            largeURL += '?zz=1';
        }

        return {
            pageURL : pageURL,
            thumbURL: thumbURL,
            largeURL: largeURL
        };
    },

    // Insired by: Lucas Smith
    // (http://lucassmith.name/2008/11/is-my-image-loaded.html)
    loadImg: function (callback, context) {
        var img  = new Image(),
            prop = img.naturalWidth ? 'naturalWidth' : 'width';

        Lang.isFunction(callback) || (callback = function () {});
        context || (context = this);

        img.src = this.get('largeURL');

        if (img.complete) {
            callback.call(context, img[prop] ? img : null);
        } else {
            img.onload  = Y.bind(callback, context, img);
            img.onerror = Y.bind(callback, context, null);
        }
    }

}, {

    ATTRS: {
        title   : {value: null},
        thumbURL: {value: null},
        largeURL: {value: null},
        pageURL : {value: null},


        location: {
            value : null,
            setter: function (location) {
                (location instanceof Place) || (location = new Place(location));
                return location;
            }
        }
    },

    YQL_ATTRS: [
        'id', 'farm', 'server', 'secret',
        'title', 'location', 'urls'
    ]

});

Y.namespace('PNM').Photo = Photo;

}, '0.7.0', {
    requires: [
        'gallery-model-sync-yql',
        'cache-offline',
        'model',
        'pnm-place',
        'yql'
    ]
});
