var LIBRARY = {

    msgBackground: function (data, responseCallback) {
        chrome.runtime.sendMessage(data, responseCallback);
    },

    onMessage: function (callback) {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            callback(request, sender, sendResponse);
        });
    },

    msgContent: function (tab_id, data) { chrome.tabs.sendMessage(tab_id, data); },

    addSymbol: function (str, symbol, len, side) {
        var cur_len,
            i;

        if (!str)
            str = '';

        str = str.toString();

        if (!side)
            side = 'left';

        if (symbol === undefined)
            symbol = '0';

        symbol.toString();

        cur_len = str.length;

        if (side === 'left') {
            for (i = 0; i < (len - cur_len); ++i) {
                str = symbol + str;
            }
        }
        else {
            for (i = 0; i < (len - cur_len); ++i) {
                str += symbol;
            }
        }

        return str;
    },

    getCurDate: function (separator) {
        var date = new Date(),
            d = date.getDate(),
            m = date.getMonth() + 1,
            y = date.getFullYear();

        if (!separator) {
            separator = '';
        }

        d = this.addSymbol(d, '0', 2, 'left');
        m = this.addSymbol(m, '0', 2, 'left');

        return y + separator + m + separator + d;
    },

    parseURL: function (url) {
        var data = {
            href: url,
            protocol: null,
            hostname: null,
            port: null,
            host: null,
            path: null,
            search: null,
            params: {},
            hash: null
        },
            re_protocol = /^([^:\/.]+:)/gi,
            re_hash = /(#.+)$/gi,
            re_host = /(^[^\/]+)/gi,
            res,
            i;

        if (url === null || url === undefined) {
            return data;
        }

        res = re_protocol.exec(url);

        if (!!res && !!res[1]) {
            data.protocol = res[1];

        }

        url = url.replace(data.protocol, '');

        url = url.replace(/^\/\//, '');

        res = re_hash.exec(url);

        if (!!res && !!res[1]) {
            data.hash = res[1];
        }

        url = url.replace(data.hash, '');

        res = re_host.exec(url);

        if (!!res && !!res[1]) {
            data.host = res[1];
        }

        url = url.replace(data.host, '');

        if (typeof data.host === "string") {
            res = data.host.split(':');
            data.hostname = res[0];

            if (!!res[1]) {
                data.port = res[1];
            }
        }

        res = url.split('?');

        data.path = res.shift();

        if (res.length > 1) {
            data.search = res.join('?');
        } else {
            if (res.length === 1) {
                data.search = res[0];
            }
        }

        if (typeof data.search === "string") {
            res = data.search.split('&');

            for (i = 0; i < res.length; ++i) {
                try {
                    data.params[res[i].split('=')[0]] = res[i].split('=')[1];
                } catch (e) { }
            }

            data.search = '?' + data.search;
        }

        return data;
    },

    ajax: function (options) {

        var opt = {
            url: "",
            data: null,
            async: true,
            success: false,
            error: function () { },
            funcdata: false,
            type: "GET"
        };

        opt = this.extend(opt, options);

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            var response;

            if (xhr.readyState == 4) {
                if (xhr.status !== 200) {
                    opt.error(xhr.status);
                }

                response = xhr.responseText;

                if (!!response) {
                    if (typeof opt.success == "function") {
                        if (!!opt.funcdata) {
                            opt.success(response, opt.funcdata);
                        } else {
                            opt.success(response);
                        }
                    }
                }
            }
        };

        xhr.open(opt.type, opt.url, opt.async);

        if (opt.type.toLowerCase() === "post") {
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }

        xhr.send(opt.data);
    }
};