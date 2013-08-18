YUI.add('pnm-no-location-view', function (Y) {

var PNM       = Y.PNM,
    Templates = Y.Template._cache,
    NoLocationView;

NoLocationView = Y.Base.create('noLocationView', Y.View, [], {

    containerTemplate: '<div class="no-location" />',
    template         : Templates['photosnearme/no-location'],

    render: function () {
        this.get('container').setHTML(this.template());
        return this;
    }

});

Y.namespace('PNM').NoLocationView = NoLocationView;

}, '0.11.0', {
    affinity: 'client',
    requires: [
        'view',
        'photosnearme-templates-no-location'
    ]
});

