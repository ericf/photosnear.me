var combo = require('combohandler'),
    path  = require('path'),

    config = require('../../conf/config'),

    dirs        = config.dirs,
    pubCombo    = combo.combine({rootPath: path.join(dirs.pub, 'js/')}),
    sharedCombo = combo.combine({rootPath: path.join(dirs.shared, 'js/')});

function send(req, res) {
    res.send(res.body);
}

exports.pub    = [pubCombo, send];
exports.shared = [sharedCombo, send];
