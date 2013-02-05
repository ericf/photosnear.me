var Y = require('yui').use('pnm-place');

module.exports = function placeLookup(rootPath) {
    return function (req, res) {
        var place     = new Y.PNM.Place(),
            placeText = req.url.split('/')[1];

        place.load({text: placeText}, function () {
            if (place.isNew()) {
                return res.send(404);
            }

            res.redirect(rootPath + place.get('id') + '/', 302);
        });
    };
};
