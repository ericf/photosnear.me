YUI_config = (function () {
    var loc    = window.location,
        filter = (loc.search.match(/[?&]filter=([^&]+)/) || [])[1] || 'min';

    return {
        filter     : filter,
        combine    : filter === 'min',
        allowRollup: false,
        gallery    : 'gallery-2011.08.31-20-57',
        groups     : {
            app: {
                base     : '/js/',
                comboBase: '/js/?',
                combine  : filter === 'min',
                root     : '',
                modules  : {
                    'place': {
                        path    : 'models/place.js',
                        requires: [ 'model'
                                  , 'yql'
                                  , 'gallery-model-sync-yql'
                                  , 'cache-offline'
                                  ]
                    },

                    'photo': {
                        path    : 'models/photo.js',
                        requires: [ 'model'
                                  , 'yql'
                                  , 'gallery-model-sync-yql'
                                  , 'cache-offline'
                                  , 'place'
                                  ]
                    },

                    'photos': {
                        path    : 'models/photos.js',
                        requires: [ 'model-list'
                                  , 'yql'
                                  , 'gallery-model-sync-yql'
                                  , 'cache-offline'
                                  , 'photo'
                                  ]
                    },

                    'grid-view': {
                        path    : 'views/grid.js',
                        requires: [ 'view'
                                  , 'node-style'
                                  , 'node-screen'
                                  , 'photos'
                                  ]
                    },

                    'photo-view': {
                        path    : 'views/photo.js',
                        requires: [ 'view'
                                  , 'place'
                                  , 'photos'
                                  ]
                    },

                    'photosnearme-view': {
                        path    : 'views/photosnearme.js',
                        requires: [ 'view'
                                  , 'place'
                                  ]
                    },

                    'photosnearme': {
                        path    : 'photosnearme.js',
                        requires: [ 'controller'
                                  , 'gallery-geo'
                                  , 'place'
                                  , 'photos'
                                  , 'photosnearme-view'
                                  , 'grid-view'
                                  , 'photo-view'
                                  ]
                    }
                }
            }
        }
    };
}());
