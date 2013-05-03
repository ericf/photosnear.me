YUI.add('pnm-no-location-view', function (Y) {

var PNM       = Y.PNM,
    Templates = PNM.Templates,
    NoLocationView;

NoLocationView = Y.Base.create('noLocationView', Y.View, [], {

    containerTemplate: '<div class="no-location" />',
    template         : Templates['no-location'],

    render: function () {
        this.get('container').setHTML(this.template());
        return this;
    }

});

Y.namespace('PNM').NoLocationView = NoLocationView;

}, '0.7.2', {
    affinity: 'client',
    requires: [
        'pnm-templates',
        'view'
    ]
});

