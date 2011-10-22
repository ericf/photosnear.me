(function () {

var filter = (window.location.search.match(/[?&]filter=([^&]+)/) || [])[1] || 'min';

// YUI Config.
YUI_config = {
    comboBase  : '/yui?',
    root       : '/build/',
    filter     : filter,
    combine    : filter === 'min',
    allowRollup: false,
    gallery    : 'gallery-2011.10.20-23-28',
    groups     : {
        app: {
            base     : '/js/',
            comboBase: '/js/?',
            combine  : filter === 'min',
            root     : '',
            modules  : {
                'place': {
                    path    : 'models/place.js',
                    requires: [ 'cache-offline'
                              , 'gallery-model-sync-yql'
                              , 'model'
                              ]
                },

                'photo': {
                    path    : 'models/photo.js',
                    requires: [ 'gallery-model-sync-yql'
                              , 'cache-offline'
                              , 'model'
                              , 'place'
                              ]
                },

                'photos': {
                    path    : 'models/photos.js',
                    requires: [ 'cache-offline'
                              , 'gallery-model-sync-yql'
                              , 'model-list'
                              , 'photo'
                              ]
                },

                'grid-view': {
                    path    : 'views/grid.js',
                    requires: [ 'node-style'
                              , 'node-screen'
                              , 'photos'
                              , 'view'
                              ]
                },

                'lightbox-view': {
                    path    : 'views/lightbox.js',
                    requires: [ 'photos'
                              , 'place'
                              , 'view'
                              ]
                },

                'photosnearme': {
                    path    : 'photosnearme.js',
                    requires: [ 'app-base'
                              , 'gallery-geo'
                              , 'place'
                              , 'photos'
                              , 'grid-view'
                              , 'lightbox-view'
                              ]
                }
            }
        }
    }
};

// Flickr API Key.
YUI && (YUI.namespace('Env.Flickr').API_KEY = '0984607e2222db7a1be6a5692741ca08');

}());
