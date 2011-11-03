YUI.add('place', function (Y) {

var Lang = Y.Lang,

    FLICKR_API_KEY = YUI.namespace('Env.Flickr').API_KEY || '';

Y.Place = Y.Base.create('place', Y.Model, [Y.ModelSync.YQL], {

    idAttribute: 'woeid',
    cache      : new Y.CacheOffline(),
    queries    : {
        placeFromId    : 'SELECT * FROM geo.places WHERE woeid={id}',
        placeFromLatLon: 'SELECT * FROM geo.places WHERE woeid ' +
                            'IN (SELECT place.woeid FROM flickr.places ' +
                            'WHERE api_key={api_key} ' +
                            'AND lat={latitude} ' +
                            'AND lon={longitude})'
    },

    buildQuery: function () {
        if (this.isNew()) {
            // assumes we at least have a lat/lon
            return Lang.sub(this.queries.placeFromLatLon, {
                api_key  : FLICKR_API_KEY,
                latitude : this.get('latitude'),
                longitude: this.get('longitude')
            });
        }

        return Lang.sub(this.queries.placeFromId, { id: this.get('id') });
    },

    parse: function (results) {
        if ( ! results) { return; }

        var data     = results.place,
            centroid = data.centroid,
            country  = data.country,
            region   = data.admin1,
            locality = data.locality1;

        return {
            woeid    : data.woeid,
            latitude : centroid.latitude,
            longitude: centroid.longitude,
            country  : country && country.content,
            region   : region && region.content,
            locality : locality && locality.content
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
    }

});

}, '0.4.0', {
    requires: [ 'cache-offline'
              , 'gallery-model-sync-yql'
              , 'model'
              , 'yql'
              ]
});
