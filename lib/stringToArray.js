module.exports = function (str, expby) {
    var ret = new Array();
    if (str) {
        var split = str.split(expby);
        for (i = 0; i < split.length; i++) {
            ss = split[i];
            ss = ss.trim();
            if (ss.length > 0) {
                ret.push(ss);
            }
        }
    }
    return ret;
}