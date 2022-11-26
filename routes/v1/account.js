/**
 * 
 * Used to Update User Profile Pic, Friends etc 2 times a day
 */
var express = require('express');
var router = express.Router();
var { facebook, getUserInfo, fbImgUpdate, status, update, removePicture, viewPicture, updatePicture, google, create, login, forgetPassword, logout } = require("../../controller/v1/account");
router.all('/user_info', getUserInfo);
router.all('/update/facebook_image', fbImgUpdate);
router.all('/update/status', status);
router.all('/update', update);
router.all('/remove_picture', removePicture);
router.all('/picture/view/:filename', viewPicture)
router.all('/update/picture', updatePicture);
router.all('/create/facebook', facebook)
router.all('/create/google', google);
router.all('/create', create);
router.all('/logout', logout)
router.all('/login', login);
router.all('/forgot_password', forgetPassword);

module.exports = router;
