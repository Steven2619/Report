// var ajaxUrl="http://192.168.43.54:8082/report/";//本地跑不起解开这条
var ajaxUrl = "";
var common = {
    getbaseUrl: function () {
        if (ajaxUrl) {
            return ajaxUrl;
        } else {
            var htmlUrl = window.location.hostname;
            var protocol = window.location.protocol;
            return (protocol + "//" + htmlUrl + ":8082/report/");
        }
    },
    //url,methed,data,contentType,callback
    sendAjax: function (opt) {
        if (opt.url.indexOf("?") == -1) {
            opt.url = opt.url + "?";
        } else {
            opt.url = opt.url + "&";
        }
        if (opt['async'] === "") {
            opt['async'] = true;
        }
        $.ajax({
            type: opt.methed || "get",
            url: opt.url + "sessionid=" + this.GetQueryString("sessionid"),
            data: opt.data,
            async: opt.async,
            contentType: opt.contentType || "application/json",
            beforeSend: opt.beforeSend,
            success: opt.callback,
            error: opt.error,
            complete: opt.complete
        })
    },
    //根据参数名name取得reportId的值
    GetQueryString: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null)return unescape(r[2]);
        return null;
    },
};
