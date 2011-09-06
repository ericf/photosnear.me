YUI.add('photos', function (Y) {

var sub = Y.Lang.sub,

    FLICKR_API_KEY = YUI.namespace('Env.Flickr').API_KEY || '';

Y.Photos = Y.Base.create('photos', Y.ModelList, [Y.ModelSync.YQL], {

    model: Y.Photo,
    cache: new Y.CacheOffline(),
    query: 'SELECT * FROM flickr.photos.search({start},{num}) ' +
                'WHERE api_key={api_key} ' +
                'AND woe_id={woeid} ' +
                'AND sort="interestingness-desc" ' +
                'AND extras="path_alias"',

    buildQuery: function (options) {
        options || (options = {});

        return sub(this.query, {
            api_key: FLICKR_API_KEY,
            start  : options.start || 0,
            num    : options.num || 100,
            woeid  : options.place.get('id')
        });
    },

    parse: function (results) {
        return results ? results.photo : [];
    },

    getPrev: function (photo) {
        if (photo && this.getByClientId(photo.get('clientId'))) {
            // We have a photo in the list
            return this.item(this.indexOf(photo) - 1);
        }
    },

    getNext: function (photo) {
        if (photo && this.getByClientId(photo.get('clientId'))) {
            // We have a photo in the list
            return this.item(this.indexOf(photo) + 1);
        }
    }

});

}, '0.3.2', {
    requires: [ 'model-list'
              , 'yql'
              , 'gallery-model-sync-yql'
              , 'cache-offline'
              , 'photo'
              ]
});
