YUI.add('pnm-no-location-view', function (Y) {

var PNM       = Y.PNM,
    Templates = Y.Template._cache,
    NoLocationView;

NoLocationView = Y.Base.create('noLocationView', Y.View, [], {

    containerTemplate: '<div class="no-location" />',
    template         : Templates['photosnearme/partials/no-location'],

    render: function () {
        this.get('container').setHTML(this.template());
        return this;
    }

});

Y.namespace('PNM').NoLocationView = NoLocationView;

}, '0.7.2', {
    affinity: 'client',
    requires: [
        'view',
        'photosnearme-partials-no-location'
    ]
});

