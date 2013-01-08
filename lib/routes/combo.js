var combo   = require('combohandler'),
    connect = require('connect'),
    path    = require('path'),

    config = require('../../conf/config'),
    dirs   = config.dirs;

module.exports = {
    pub   : combo.combine({rootPath: path.join(dirs.pub, 'js/')}),
    shared: combo.combine({rootPath: path.join(dirs.shared, 'js/')})
};
