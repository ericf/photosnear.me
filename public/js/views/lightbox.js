YUI.add('lightbox-view', function (Y) {

Y.LightboxView = Y.Base.create('lightboxView', Y.View, [], {

    container: '<div id="lightbox" />',
    template : Handlebars.compile(Y.one('#lightbox-template').getContent()),
    events   : {
        '.show-photos': { 'click': 'showPhotos' },
        '.prev'       : { 'click': 'prev' },
        '.next'       : { 'click': 'next' }
    },

    initializer: function (config) {
        config || (config = {});

        this.place  = config.place;
        this.photos = config.photos;

        this.publish({
            navigate  : { preventable: false },
            showPhotos: { preventable: false }
        });
    },

    render: function () {
        var photo  = this.model,
            place  = this.place,
            photos = this.photos,
            nav, prev, next;

        if ( ! photos.isEmpty()) {
            nav  = {};
            prev = photos.getPrev(photo);
            next = photos.getNext(photo);

            prev && (nav.prev = '../' + prev.get('id') + '/');
            next && (nav.next = '../' + next.get('id') + '/');
        }

        this.container.setContent(this.template({
            placeId    : place.get('id'),
            placeText  : place.toString(),
            title      : photo.get('title') || 'Photo',
            description: photo.get('description') || '',
            largeUrl   : photo.get('largeUrl'),
            nav        : nav
        }));

        return this;
    },

    showPhotos: function (e) {
        e.preventDefault();
        this.fire('showPhotos');
    },

    prev: function (e) {
        e.preventDefault();
        var photo = this.photos.getPrev(this.model);
        if (photo) {
            this.fire('navigate', { photo: photo });
        }
    },

    next: function (e) {
        e.preventDefault();
        var photo = this.photos.getNext(this.model);
        if (photo) {
            this.fire('navigate', { photo: photo });
        }
    }

});

}, '0.3.2', {
    requires: [ 'view'
              , 'place'
              , 'photos'
              ]
});
