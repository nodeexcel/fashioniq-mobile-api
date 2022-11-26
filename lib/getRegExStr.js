module.exports =
    function (string) {
        string = fltr_val.replace(/\[/g, '');
        string = fltr_val.replace(/\]/g, '');
        string = new RegExp(string, "i");
        return string;
    }
