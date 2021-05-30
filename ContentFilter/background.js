// регистрация события нажатия на кнопку на браузере
chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage()
});

// первый запуск или обновление
chrome.runtime.onInstalled.addListener(reason => {
    console.log(new Date().toLocaleTimeString(),"onInstalled",reason)
    chrome.storage.local.get("Config", (data) => {
        if (!data || !data.Config) {
            // если конфигурации нет то грузим ее
            SaveConfig({...DefConfig()},"",chrome.runtime.openOptionsPage)
        } else {
            // конфигурация есть
            if (data.Config.ComputerName == "") {
                chrome.runtime.openOptionsPage()
            }
        }
        console.log(new Date().toLocaleTimeString(),"First init onInstalled", data)
    })
});

// регистрация сбытий на проверку страниц 
// {type: [check, addl, addd] , body:"", url:"", status: [bl,bw,bd, wl, wd, wm, oo], reason:"" }
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(new Date().toLocaleTimeString(), "IN ->", request.type, request.url)

    if (request.type == "checkFFF") {
        analizeBody(request, sendResponse)
    } // check finish

    if (request.type == "resetDB") {
        SaveConfig({ ...DefConfig() },"",chrome.runtime.openOptionsPage)
        sendResponse("ok")
    }

    if (request.type == "openOptions") {
        chrome.runtime.openOptionsPage()
    }

    if (request.type == "addURLFFF") {
        sendResponse("ok")
        chrome.storage.local.get("Config", (data) => {
            if (!data || !data.Config || !data.Config.VersionDB || !data.Config.DB) return

            if (!data.Config.DB.my_url) {
                data.Config.DB.my_url = []
            }


            // проверить на уникальность !!!!!!!!!
            toAdd = urlStripPrefix(request.url)
            if (data.Config.DB.my_url.includes(toAdd) == false) {
                data.Config.DB.my_url.push(toAdd)
                SaveConfig(data.Config)
            }

            console.log(new Date().toLocaleTimeString(),"OUT->", request.type, request.url, "add ok")
        })

    }
});


////////////////////////////////////////////////////////////////
// обновляем конфигурацию каждые 1 минуты
chrome.alarms.create("getCFG", { periodInMinutes: 1, delayInMinutes: 0.1 });
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name == "getCFG") {
        GetConfig()
        return
    }
});

function GetConfig() {
    chrome.storage.local.get("Config", (data) => {
        if (!data || !data.Config || !data.Config.BaseURL || !data.Config.VersionDB) {
            console.log(new Date().toLocaleTimeString(), "Init new Config:")
            SaveConfig({ ...DefConfig() })
            return
        }

        console.log(new Date().toLocaleTimeString(), "GetConfig start")
        CFG = data.Config
        // проверяем версию на сервере
        const updCfgURL = `${CFG.BaseURL}cfg.json`
        const updDBURL = `${CFG.BaseURL}db.json`;

        fetch(updCfgURL)
            .then(res => res.json())
            .then(jCfg => {
                if (!jCfg.VersionDB || jCfg.VersionDB <= CFG.VersionDB) return
                console.log(new Date().toLocaleTimeString(), `GetConfig Update db needed form ${CFG.VersionDB} to ${jCfg.VersionDB}. Trying...`)

                fetch(updDBURL)
                    .then(res => res.json())
                    .then(jDB => {
                        CFG = { ...jCfg, ComputerName: CFG.ComputerName }
                        CFG.DB = { ...jDB }
                        SaveConfig(CFG)
                        console.log(new Date().toLocaleTimeString(), "GetConfig Update OK:", new Date().toTimeString())
                    })
                    .catch(err => {
                        console.log(new Date().toLocaleTimeString(),"GetConfig Update db error:", err)
                    })
            })
            .catch(err => {
                console.log(new Date().toLocaleTimeString(),"GetConfig cfg error:", err)
            })
    })
}


// конфигурация по умолчанию
function DefConfig() {
    const out = {
        VersionDB: 1,
        BaseURL: "https://sc-15.ru/_content_filter_/bin/",
        ComputerName: "",
        DB: {
            block_domain: ["2ionwarriors.7fi.ru", "akhbarsham.info"],
            block_url: ["vk.com/id-igor_akimov", "ok.ru/video/41387428473"],
            block_words: ["21sextury", "4(-|s)метиламинорекс"],

            white_domain: ["sc-15.ru", "lab31.ru", "lidrekon.ru"],
            white_url: ["neo.edu.ru/wps/portal", "lego.com/ru-ru/games"],
        }
    }
    return out
}

function SaveConfig(cfg, compName, callback) {
    chrome.storage.local.get("Config", data => {
        if(!compName) compName = data.Config.ComputerName;
        
        cfg.ComputerName = compName;
        console.log(new Date().toLocaleTimeString(),"Save Config", cfg)
        chrome.storage.local.set({ Config: cfg }, () => {
            // выполнить действие после сохранения
            if(callback) callback()
        })
    })
}


function urlStripPrefix(url) {
    let hostname;
    if (url.indexOf("://") > -1) {
        hostname = url.split("://")[1];
    } else {
        hostname = url;
    }
    hostname = hostname.split('?')[0];

    if (hostname.startsWith("www.")) hostname = hostname.substring(4);

    hostname = hostname.split('/').slice(0, -1).join('/');

    return hostname
}

function urlDomain(url, tld = true) {
    let hostname;

    //find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    } else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];

    //find & remove "?"
    hostname = hostname.split('?')[0];

    if (tld) {
        let hostnames = hostname.split('.');
        hostname = hostnames[hostnames.length - 2] + '.' + hostnames[hostnames.length - 1];
    }



    return hostname.toLowerCase();
}

function escapeRegExp(s) {
    out = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    //s!=out ? console.log(out, s) : {}
    return out
}

function matchRegExp(urlStr, arr, debug = false) {
    if (!arr) return false
    var num = arr.length;
    for (var i = 0; i < num; i++) {
        if (arr[i] === '') continue;

        var regStr = "^((http|https):\/\/)?(www.|)?" + escapeRegExp(arr[i]);
        // var regStr = "^((http|https):\/\/(www.|))?" + arr[i];
        var reg = new RegExp(regStr);
        debug ? console.log(regStr, urlStr) : {}
        if (reg.test(urlStr)) {
            return {
                'key': urlStr,
                'match': arr[i],
                'count': 1,
            };
        }
    }
    return false;
};

function matchWordExp(bodyStr, arr, debug = false) {
    if (!arr) return false
    var badStr = '';
    var num = arr.length;
    for (var i = 0; i < num; i++) {

        // var reg = new RegExp(badWorld[i], 'img');
        var reg = new RegExp('(^|\\s)' + arr[i] + '($|\\s)', 'img');  //   (^|\s)word($|\s)  img
        var regStr = new RegExp('(.{0,20}' + arr[i] + '.{0,20})', 'img');  //(.{0,40}word.{0,40}) img
        if (reg.test(bodyStr)) {

            ret = bodyStr.match(regStr) || ['???']

            return {
                'key': `${ret[0]}`,
                'match': arr[i],
                'count': ret.length
            };
        }
    }
    return false;
}



function analizeBody(request, sendResponse) { // на белые Domen\


    CFG = request.CFG;

    dataWeb = {
        title: request.title,
        bodySize: request.body.length,
        url: request.url,
        ComputerName: CFG.ComputerName,
        BaseURL: CFG.BaseURL,
    }


    // на белые Domen
    ret = matchRegExp(urlDomain(request.url), CFG.DB.white_domain)
    if (ret) {
        SendStat({ type: "wd", ...dataWeb, ...ret }, sendResponse)
        return true
    }
    // на белые URL
    ret = matchRegExp(request.url, CFG.DB.white_url)
    if (ret) {
        SendStat({ type: "wu", ...dataWeb, ...ret }, sendResponse)
        return true
    }


    // на мои URL
    ret = matchRegExp(request.url, CFG.DB.my_url)
    if (ret) {
        SendStat({ type: "wm", ...dataWeb, ...ret }, sendResponse)
        return true
    }

    // на черные Domen
    ret = matchRegExp(urlDomain(request.url), CFG.DB.block_domain)
    if (ret) {
        SendStat({ type: "bd", ...dataWeb, ...ret }, sendResponse)
        return true
    }
    // на черные URL
    ret = matchRegExp(request.url, CFG.DB.block_url)
    if (ret) {
        SendStat({ type: "bu", ...dataWeb, ...ret }, sendResponse)
        return true
    }

    // на черные слова Body
    ret = matchWordExp(request.body, CFG.DB.block_words)
    if (ret) {
        SendStat({ type: "bw", ...dataWeb, ...ret, detail: "BODY" }, sendResponse)
        return true
    }
    // на черные слова title
    ret = matchWordExp(request.title, CFG.DB.block_words)
    if (ret) {
        SendStat({ type: "bw", ...dataWeb, ...ret, detail: "TITLE" }, sendResponse)
        return true
    }
    // на черные слова Meta
    ret = matchWordExp(request.meta, CFG.DB.block_words)
    if (ret) {
        SendStat({ type: "bw", ...dataWeb, ...ret, detail: "META" }, sendResponse)
        return true
    }

    // посылаем статистику
    SendStat({ type: "ok", ...dataWeb, key: "", match: "", count: 0 }, sendResponse)
    return false
}

function SendStat(dataFilter, sendResponse) {
    BaseURL = dataFilter.BaseURL
    delete dataFilter.BaseURL

    console.log(new Date().toLocaleTimeString(), "OUT->", dataFilter.type, dataFilter.key, dataFilter.match, dataFilter.count)

    // посылаем ответ
    sendResponse(dataFilter)

    const statURL = `${BaseURL}stat.php`
    fetch(statURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(dataFilter).substring(1)
    })
}