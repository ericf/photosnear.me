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

Photos = Y.Base.create('photos', Y.LazyModelList, [Y.ModelSync.YQL], {

    model: Y.PNM.Photo,
    cache: cache,
    query: 'SELECT {attrs} FROM flickr.photos.search({start},{num}) ' +
                'WHERE api_key={api_key} ' +
                'AND safe_search=1 ' +
                'AND woe_id={woeid} ' +
                'AND sort="interestingness-desc" ' +
                'AND extras="path_alias,url_sq,url_z"',

    buildQuery: function (options) {
        options || (options = {});

        return Lang.sub(this.query, {
            api_key: PNM_ENV.FLICKR.api_key || '',
            start  : options.start || 0,
            num    : options.num || 30,
            woeid  : options.place.get('id'),
            attrs  : this.model.YQL_ATTRS
        });
    },

    parse: function (results) {
        var photos     = results.photo,
            modelProto = this.model.prototype;

        Lang.isArray(photos) || (photos = [photos]);
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

}, '0.7.0', {
    requires: [
        'cache-offline',
        'gallery-model-sync-yql',
        'lazy-model-list',
        'pnm-photo',
        'yql'
    ]
});
