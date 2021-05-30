const toolTipID = "tooltip1123213"
const blockTipID = "block1123213"
const filerTimeOut = 10000

doFilter()

var oldBody = getContent(window.document)
setInterval(() => {
    if (isBlockTip()) {
        console.log(new Date().toLocaleTimeString(),"Alredy blocked:", window.document.title, window.location.href)
        return
    }

    newBody = getContent(window.document)
    // console.log(`old body ${oldBody.length}, new body ${newBody.length}`)
    if (oldBody != newBody) {
        console.log(new Date().toLocaleTimeString(),"Filter for new body", oldBody.length, newBody.length, window.document.title, window.location.href)
        // console.log(compareText(oldBody, newBody))
        oldBody = newBody;
        doFilter()
    }
}, filerTimeOut)



function isBlockTip() {
    return !!document.getElementById(blockTipID)
}

function deleteBlockTip() {
    var msg = {
        type: "addURLFFF",
        url: window.location.href
    }
    chrome.runtime.sendMessage(msg, function (response) {
        // получаем ответ 
        console.log(new Date().toLocaleTimeString(),"addURL:", msg.url, "->", response, "Start filter again.");
        setTimeout(doFilter, 1000)
    });

    d = document.getElementById(blockTipID);
    if (!d) return
    d.remove();    
}

function createBlockTip(val) {
    if (!val) return

    let ids = blockTipID


    let div = document.createElement('div');
    div.id = ids;
    // div.style = "position: fixed; text-align: center; padding: 2px; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 0, 0, 1); z-index: 44443333; border-radius: 0px;";
    div.style = "position: fixed; text-align: center; padding: 2px; top: 0; left: 0; width: 200; height: 200; background-color: rgba(255, 0, 0, 1); z-index: 44443333; border-radius: 0px;";
    div.innerHTML = `<input id=${ids + ".button"} type="button" value="OK" onclick=""><div>${JSON.stringify(val)}</div>`;
    document.body.append(div)

    document.getElementById(ids + ".button").onclick = deleteBlockTip;
}

function deleteToolTip() {
    d = document.getElementById(toolTipID);
    if (!d) return
    d.remove();
}

function createToolTip(val) {
    if (!val) return

    deleteToolTip()

    let div = document.createElement('div');
    div.id = toolTipID;
    //all: initial;
    div.style = "all: unset; line-height:1; font-size:1 rem; position: fixed; text-align: center; padding: 1px; top: 0; left: 0; width: 23px; height: 16px; background-color: rgba(0, 255, 0, 1); z-index: 44443333; border-radius: 5px;";
    // div.innerHTML = `${val.type}${val.key ? ` ${val.key}` : ""}${val.count ? `(${val.count})\r\n${val.match}` : ""}`;
    div.innerHTML = `${val.type}`;
    document.body.append(div)
    // setTimeout(deleteToolTip, val?.type[0] == 'b' ? 200000 : 100000);
}

function getContent(doc) {
    if (!doc.body) return "";

    // deleteToolTip()
    BodyCopy = doc.body.cloneNode(true);

    BodyCopy.querySelectorAll("style").forEach(item => item.remove())
    BodyCopy.querySelectorAll("script").forEach(item => item.remove())

    text = BodyCopy.innerHTML
    text = text.replace(/<.*?>/g, " ")
    text = text.replace(/[\s]+/g, " ")
    // console.log(text)

    return text
}


// var pageDescription = getMetaContent(document, "description");
// var pageKeywords = getMetaContent(document, "keywords");
function getMetaContent(doc, propName) {
    var metas = doc.getElementsByTagName('meta');
    if (!metas) return ''

    out = ''

    for (i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute("name") == propName) {
            out += metas[i].getAttribute("content") + " \r\n";
        }
    }
    return out;
}

function doFilter() {

    chrome.storage.local.get("Config", data => {

        if(!data || !data.Config || !data.Config.DB) {
            console.log(new Date().toLocaleTimeString(),"No CFG data. Skeping....")
            return
        }

        var msg = {
            type: "checkFFF",
            body: getContent(window.document),
            meta: getMetaContent(document, "description") + getMetaContent(document, "keywords"),
            title: window.document.title,
            url: window.location.href,
            CFG: data.Config,
        }


        console.log(new Date().toLocaleTimeString(),"F->", msg.url, msg.title, msg.body.length);
        if (msg.body && msg.body.length > 50) {
            // {type: [check, addl, addd] , body:"", title:"", url:"", status: [bl,bw,bd, wl, wd, ml, md, ok], reason:"" }
            chrome.runtime.sendMessage(msg, function (response) {
                // получаем ответ 
                console.log(new Date().toLocaleTimeString(),"F<-", response.type, response.key, response.match, msg.url, msg.title);
                if (!response) return

                createToolTip(response)
                if (response.type[0] == "b") {
                    createBlockTip(response)
                    return
                }
            });
            return

        }

        console.log(new Date().toLocaleTimeString(),"F<- (to small body)", msg.url, msg.body.length);
        return
    })
}

function compareText(oldText, newText) {
    var difStart, difEndOld, difEndNew;

    //from left to right - look up the first index where characters are different
    for (let i = 0; i < oldText.length; i++) {
        if (oldText.charAt(i) !== newText.charAt(i)) {
            difStart = i;
            break;
        }
    }

    //from right to left - look up the first index where characters are different
    //first calc the last indices for both strings
    var oldMax = oldText.length - 1;
    var newMax = newText.length - 1;
    for (let i = 0; i < oldText.length; i++) {
        if (oldText.charAt(oldMax - i) !== newText.charAt(newMax - i)) {
            //with different string lengths, the index will differ for the old and the new text
            difEndOld = oldMax - i;
            difEndNew = newMax - i;
            break;
        }
    }

    var removed = oldText.substr(difStart, difEndOld - difStart + 1);
    var added = newText.substr(difStart, difEndNew - difStart + 1);

    return [difStart, added, removed];
}