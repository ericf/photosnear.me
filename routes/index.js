module.exports = {
    photos   : require('./photos'),
    places   : require('./places'),
    templates: require('./templates'),

    index: function (req, res, next) {
        res.render('index', {located: false});
    }
};
