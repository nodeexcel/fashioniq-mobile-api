var express = require('express');
var fs = require('fs');
var router = express.Router();
var mongoose = require('mongoose');
const { googleLookup, facebookLookup } = require('../../controller/v1/invite');

function updateFriends(me, row, req, res, done) {
    var User = req.User;
    if (row) {
        var user_friends = row.get('friends');
        var me_id = me.get('_id') + "";
        if (user_friends.indexOf(me_id) == -1) {
            user_friends.push(me_id);
            User.update({
                _id: row.get('_id')
            }, {
                $set: {
                    friends: user_friends
                }
            }, function (err) {
                if (err) {
                    console.log('error updating your friends list')
                }
                done();
            });
        } else {
            done();
        }
    } else {
        done();
    }
}

router.all('/google/lookup', googleLookup);

router.all('/facebook/lookup',facebookLookup);
module.exports = router;