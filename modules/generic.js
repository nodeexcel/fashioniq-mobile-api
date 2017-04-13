var urlMod = require('url');
var querystring = require('querystring');
module.exports = {
    getAffiliateUrl: function (website, url) {
        aff_url = 'http://linksredirect.com?pub_id=2491CL2376&url=' + encodeURIComponent(url);
        return aff_url;
    },
};
