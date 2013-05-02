YUI.add('pnm-photos', function (Y) {

var PNM_ENV = YUI.namespace('Env.PNM'),

    Lang = Y.Lang,
    Photos, cache;

// Create model cache. Server uses a strict maximum number of entries which is
// not a supported attribute by `CacheOffline`.
if ('max' in PNM_ENV.CACHE.photos) {
    cache = new Y.Cache(PNM_ENV.CACHE.photos);
} else {
    cache = new Y.CacheOffline(PNM_ENV.CACHE.photos);
}

Photos = Y.Base.create('photos', Y.LazyModelList, [], {

    model: Y.PNM.Photo,
    cache: cache,
    url  : 'http://api.flickr.com/services/rest/?method=flickr.photos.search' +
                '&api_key={api_key}' +
                '&woe_id={woeid}' +
                '&per_page={num}' +
                '&page={page}' +
                '&safe_search=1' +
                '&sort=interestingness-desc' +
                '&format=json',

    sync: function (action, options, callback) {
        if (action !== 'read') { return callback('Only "read" is supported.'); }

        var cache = this.cache,
            num   = options.num || 60,
            url, hit;

        url = Lang.sub(this.url, {
            api_key: PNM_ENV.FLICKR.api_key || '',
            woeid  : options.place.get('id'),
            num    : num,
            page   : Math.ceil((options.start || 0) / num) + 1
        });

        hit = cache && cache.retrieve(url);

        if  (hit) {
            return callback(null, hit.response);
        }

        Y.jsonp(url, {
            format: function (url, proxy) {
                return url + '&jsoncallback=' + proxy;
            },

            on: {
                failure: function () {
                    callback.apply(null, arguments);
                },

                success: function (response) {
                    if (response.stat !== 'ok') {
                        return callback(response.message, response);
                    }

                    if (cache && response) {
                        cache.add(url, response);
                    }

                    callback(null, response);
                }
            }
        });
    },

    parse: function (results) {
        var photos     = results && results.photos && results.photos.photo,
            modelProto = this.model.prototype;

        if (!Lang.isArray(photos)) {
            photos = photos ? [photos] : [];
        }

        return Y.Array.map(photos, modelProto.parse, modelProto);
    },

    getPrev: function (photo) {
        // Check that the photo is in the list first.
        if (photo && this.getById(photo.get('id'))) {
            return this.revive(this.indexOf(photo) - 1);
        }
    },

    getNext: function (photo) {
        // Check that the photo is in the list first.
        if (photo && this.getById(photo.get('id'))) {
            return this.revive(this.indexOf(photo) + 1);
        }
    }

});

Y.namespace('PNM').Photos = Photos;

}, '0.7.2', {
    requires: [
        'cache-offline',
        'jsonp',
        'lazy-model-list',
        'pnm-photo'
    ]
});
