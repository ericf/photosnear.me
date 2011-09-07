YUI.add('grid-view', function (Y) {

Y.GridView = Y.Base.create('gridView', Y.View, [], {

    container    : '<div id="photos" />',
    template     : Handlebars.compile(Y.one('#grid-template').getContent()),
    photoTemplate: Handlebars.compile(Y.one('#grid-photo-template').getContent()),
    events       : {
        '.photo': { 'click': 'select' }
    },

    initializer: function (config) {
        config || (config = {});

        var photos = this.photos = config.photos;
        photos.after('reset', this.render, this);
        photos.after('add', this.addPhoto, this);
        photos.after('remove', this.removePhoto, this);

        this.loadingNode = null;

        this.publish({
            more  : { preventable: false },
            select: { preventable: false }
        });

        this._maxKnownHeight = 0;

        Y.one('win').on(['scroll', 'resize'], this.more, this);
    },

    render: function () {
        this.container.setContent(this.template({
            photos: this.photos.map(function (photo) {
                return {
                    clientId: photo.get('clientId'),
                    pageUrl : photo.get('pageUrl'),
                    thumbUrl: photo.get('thumbUrl')
                };
            })
        }, {
            partials: { photo: this.photoTemplate }
        }));

        this.loadingNode = this.container.one('.loading');

        return this;
    },

    addPhoto: function (e) {
        var container = this.container,
            photo     = e.model,
            list      = container.one('ul'),
            content;

        content = this.photoTemplate({
            clientId: photo.get('clientId'),
            pageUrl : photo.get('pageUrl'),
            thumbUrl: photo.get('thumbUrl')
        });

        this.loadingNode.hide();
        list.insert(content, list.all('.photo').item(e.index));
    },

    removePhoto: function (e) {
        this.container.all('.photo').splice(e.index, 1);
    },

    more: function (e) {
        var viewportBottom = Y.DOM.viewportRegion().bottom,
            maxKnowHeight  = this._maxKnownHeight,
            containerBottom;

        if (viewportBottom <= maxKnowHeight) { return; }

        containerBottom = this.container.get('region').bottom;

        if ((viewportBottom + 150) > containerBottom && containerBottom > maxKnowHeight) {
            this._maxKnownHeight = containerBottom;
            this.loadingNode.show();
            this.fire('more');
        }
    },

    select: function (e) {
        e.preventDefault();

        var photoNode  = e.currentTarget,
            photoNodes = this.container.all('.photo'),
            photo      = this.photos.getByClientId(photoNode.get('id'));

        photoNodes.removeClass('selected');
        photoNode.addClass('selected');

        this.fire('select', { photo: photo });
    },

    reset: function () {
        this._maxKnownHeight = 0;
        this.container.all('.photo.selected').removeClass('selected');
        return this;
    }

});

}, '0.3.2', {
    requires: [ 'view'
              , 'node-style'
              , 'node-screen'
              , 'photos'
              ]
});
