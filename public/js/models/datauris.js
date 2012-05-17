YUI.add('pnm-datauris', function (Y) {

var Lang = Y.Lang,
    DataURIs;

DataURIs = Y.Base.create('datauris', Y.ModelList, [Y.ModelSync.YQL], {

    query       : 'SELECT * FROM query.multi WHERE queries=\'{queries}\'',
    dataURIQuery: 'SELECT * FROM data.uri WHERE url="{url}"',

    buildQuery: function (options) {
        options || (options = {});

        var dataURIQueries = Y.Array.map(options.urls, function (url) {
            return Lang.sub(this.dataURIQuery, {url: url});
        }, this);

        return Lang.sub(this.query, {queries: dataURIQueries.join(';')});
    },

    parse: function (results) {
        var dataURIs = results ? results.results : [];
        return Lang.isArray(dataURIs) ? dataURIs : [datauris];
    }

});

Y.namespace('PNM').DataURIs = DataURIs;

}, '0.5.2', {
    requires: [
        'gallery-model-sync-yql',
        'model-list',
        'yql'
    ]
});
