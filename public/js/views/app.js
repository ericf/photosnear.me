YUI.add('photosnearme-view', function (Y) {

Y.PhotosNearMeView = Y.Base.create('photosNearMeView', Y.View, [], {

    container     : Y.one('#wrap'),
    titleTemplate : Handlebars.compile(Y.one('#title-template').getContent()),
    headerTemplate: Handlebars.compile(Y.one('#header-template').getContent()),

    initializer: function (config) {
        config || (config = {});

        this.place = config.place;
        this.place.after('change', this.render, this);
    },

    render: function () {
        var place     = this.place,
            placeText = place.toString();

        Y.config.doc.title = this.titleTemplate({ place: placeText });

        this.container.removeClass('loading')
            .one('#header').setContent(this.headerTemplate({
                place: placeText
            }));

        if ( ! place.isNew()) {
            // Delays the addition of the CSS class until after render.
            Y.later(1, this.container, 'addClass', 'located');
        }

        return this;
    },

    hideUrlBar: Y.UA.ios && ! Y.UA.ipad ? function () {
        Y.later(1, Y.config.win, 'scrollTo', [0, 1]);
    } : function () {}

});

}, '0.3.2', {
    requires: [ 'view'
              , 'place'
              ]
});
