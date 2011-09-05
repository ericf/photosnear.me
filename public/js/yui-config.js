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
                        path    : 'place.js',
                        requires: [ 'model'
                                  , 'yql'
                                  , 'gallery-model-sync-yql'
                                  , 'cache-offline'
                                  ]
                    },

                    'photo': {
                        path    : 'photo.js',
                        requires: [ 'model'
                                  , 'yql'
                                  , 'gallery-model-sync-yql'
                                  , 'cache-offline'
                                  , 'place'
                                  ]
                    },

                    'photos': {
                        path    : 'photos.js',
                        requires: [ 'model-list'
                                  , 'yql'
                                  , 'gallery-model-sync-yql'
                                  , 'cache-offline'
                                  , 'photo'
                                  ]
                    },

                    'grid-view': {
                        path    : 'grid-view.js',
                        requires: [ 'view'
                                  , 'node-style'
                                  , 'node-screen'
                                  , 'photos'
                                  ]
                    },

                    'photo-view': {
                        path    : 'photo-view.js',
                        requires: [ 'view'
                                  , 'place'
                                  , 'photos'
                                  ]
                    },

                    'photosnearme-view': {
                        path    : 'photosnearme-view.js',
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
