YUI.add('lightbox-view', function (Y) {

Y.LightboxView = Y.Base.create('lightboxView', Y.View, [], {

    template     : Handlebars.compile(Y.one('#lightbox-template').getContent()),
    photoTemplate: Handlebars.compile(Y.one('#lightbox-photo-template').getContent()),

    initializer: function () {
        this.after('modelChange', this.render);
    },

    render: function () {
        var photo  = this.get('model'),
            photos = this.get('modelList'),
            place  = this.get('place'),
            content, nav, prev, next;

        if (!photos.isEmpty()) {
            nav  = {};
            prev = photos.getPrev(photo);
            next = photos.getNext(photo);

            if (prev) {
                prev.loadImg();
                nav.prev = '../' + prev.get('id') + '/';
            }

            if (next) {
                next.loadImg();
                nav.next = '../' + next.get('id') + '/';
            }

            nav.both = !!prev && !!next;
        }

        content = this.template({
            place: {
                id  : place.get('id'),
                text: place.toString()
            },

            photo: {
                title   : photo.get('title') || 'Photo',
                largeUrl: photo.get('largeUrl'),
                pageUrl : photo.get('pageUrl')
            },

            nav: nav
        }, {
            partials: {photo: this.photoTemplate}
        });

        this.get('container').setContent(content);
        return this;
    }

}, {

    ATTRS: {
        container: {
            valueFn: function () {
                return Y.Node.create('<div id="lightbox" />');
            }
        },

        place: {}
    }

});

}, '0.3.2', {
    requires: [ 'photos'
              , 'place'
              , 'view'
              ]
});
