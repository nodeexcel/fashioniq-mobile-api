var FCM = require('fcm-node');

module.exports = {
    push_notification: function(token, payload, notify, callback) {
        var serverKey = 'AAAAoDVUotg:APA91bGSSsdmlLFx9ihoi3Kq7XMrYr24pMKfL93j4M9p7qNg8eWeqYWmp9HSfbUhaqjZxEC9uvrXQ6_Fgs5mKUcov2xNKHqkKxUNx9Bd7rjhYJ2g7472Z-DxkPLZYv4cny8wah4w1LON';
        var fcm = new FCM(serverKey);
        var message = {
            to: token,
            collapse_key: 'your_collapse_key',
            notification: notify,
            data: payload,
        };
        fcm.send(message, function(err, response) {
            if (err) {
                callback('error', err);
            } else {
                callback('success', response)
            }
        });
    }
};
