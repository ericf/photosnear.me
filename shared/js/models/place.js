YUI.add('pnm-place', function (Y) {

var Lang = Y.Lang,
    Place, cache;

// Create model cache. Server uses a strict maximum number of entries which is
// not a supported attribute by `CacheOffline`.
if ('max' in PNM.CACHE.place) {
    cache = new Y.Cache(PNM.CACHE.place);
} else {
    cache = new Y.CacheOffline(PNM.CACHE.place);
}

Place = Y.Base.create('place', Y.Model, [Y.ModelSync.YQL], {

    cache      : cache,
    idAttribute: 'woeid',

    queries: {
        placeFromId    : 'SELECT {attrs} FROM geo.placefinder WHERE woeid={id}',
        placeFromText  : 'SELECT {attrs} FROM geo.placefinder WHERE text="{text}"',
        placeFromLatLon: 'SELECT {attrs} FROM geo.placefinder WHERE woeid IN ' +
                            '(SELECT place.woeid FROM flickr.places WHERE ' +
                            'api_key={api_key} AND lat={latitude} AND lon={longitude})'
    },

    buildQuery: function (options) {
        if (this.isNew()) {
            if (options.text) {
                return Lang.sub(this.queries.placeFromText, {
                    text : options.text,
                    attrs: Place.YQL_ATTRS
                });
            }

            // Assume we at least have a lat/lon.
            return Lang.sub(this.queries.placeFromLatLon, {
                api_key  : PNM.FLICKR.api_key || '',
                latitude : this.get('latitude'),
                longitude: this.get('longitude'),
                attrs    : Place.YQL_ATTRS
            });
        }

        return Lang.sub(this.queries.placeFromId, {
            id   : this.get('id'),
            attrs: Place.YQL_ATTRS
        });
    },

    parse: function (results) {
        if (!results) { return; }

        var place = results.Result;

        return {
            woeid    : place.woeid,
            latitude : place.latitude,
            longitude: place.longitude,
            country  : place.country,
            region   : place.state,
            locality : place.city
        };
    },

    toString: function () {
        var country  = this.get('country'),
            region   = this.get('region'),
            locality = this.get('locality');

        if (locality) {
            return (locality + ', ' + region);
        }

        if (region) {
            return (region + ', ' + country);
        }

        return country || '';
    }

}, {

    ATTRS: {
        woeid    : {},
        latitude : {},
        longitude: {},
        country  : {},
        region   : {},
        locality : {}
    },

    YQL_ATTRS: ['woeid', 'latitude', 'longitude', 'country', 'state', 'city']

});

Y.namespace('PNM').Place = Place;

}, '0.11.0', {
    requires: [
        'cache-offline',
        'gallery-model-sync-yql',
        'model',
        'yql'
    ]
});
