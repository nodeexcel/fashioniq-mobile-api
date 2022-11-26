function addAuth(user, device, req, res, next) {
    var auth_strategy = req.auth_strategy;
    auth_strategy.createAuth(user.id, device, req, function (err, data) {
        if (err) {
            next(err);
        } else {
            console.log('login auth data');
            console.log(data);
            user.api_key = data.api_key;
            user.api_secret = data.api_secret;
            console.log(user);
            next(false, user);
        }
    });
}

module.exports = addAuth; 