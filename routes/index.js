module.exports = {
    photos: require('./photos'),
    places: require('./places'),

    index: function (req, res, next) {
        res.render('index-page', {located: false});
    }
};
