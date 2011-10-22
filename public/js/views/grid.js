YUI.add('grid-view', function (Y) {

Y.GridView = Y.Base.create('gridView', Y.View, [], {

    template     : Handlebars.compile(Y.one('#grid-template').getContent()),
    photoTemplate: Handlebars.compile(Y.one('#grid-photo-template').getContent()),
    events       : {
        '.photo': { 'click': 'select' }
    },

    initializer: function (config) {
        var photos = this.get('modelList');

        photos.after('reset', this.render, this);
        photos.after('add', this.addPhoto, this);
        photos.after('remove', this.removePhoto, this);

        this.loadingNode     = null;
        this._maxKnownHeight = 0;

        this.publish('more', {preventable: false});

        Y.one('win').on(['scroll', 'resize'], this.more, this);
    },

    render: function () {
        var photos    = this.get('modelList'),
            container = this.get('container');

        container.setContent(this.template({
            photos: photos.map(function (photo) {
                return {
                    clientId: photo.get('clientId'),
                    pageUrl : '/photo/' + photo.get('id') + '/',
                    thumbUrl: photo.get('thumbUrl')
                };
            })
        }, {
            partials: { photo: this.photoTemplate }
        }));

        this.loadingNode = container.one('.loading');

        return this;
    },

    addPhoto: function (e) {
        var container = this.get('container'),
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
        this.get('container').all('.photo').splice(e.index, 1);
    },

    more: function (e) {
        var viewportBottom = Y.DOM.viewportRegion().bottom,
            maxKnowHeight  = this._maxKnownHeight,
            containerBottom;

        if (viewportBottom <= maxKnowHeight) { return; }

        containerBottom = this.get('container').get('region').bottom;

        if ((viewportBottom + 150) > containerBottom && containerBottom > maxKnowHeight) {
            this._maxKnownHeight = containerBottom;
            this.loadingNode.show();
            this.fire('more');
        }
    },

    reset: function () {
        this._maxKnownHeight = 0;
        this.get('container').all('.photo.selected').removeClass('selected');
        return this;
    }

}, {

    ATTRS: {
        container: {
            valueFn: function () {
                return Y.Node.create('<div id="photos" />');
            }
        }
    }

});

}, '0.3.2', {
    requires: [ 'node-style'
              , 'node-screen'
              , 'photos'
              , 'view'
              ]
});
