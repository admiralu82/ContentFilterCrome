const suffix = "---"

function UpdateAttr(attr) {
    // console.log("--",attr,LIBRARY.loadS(attr))
    chrome.storage.local.get("Config", data => {
        config = data.Config
        if (!config[attr]) return
        window.document.getElementById(attr).value = config[attr]
    })
};

UpdateAttr("ComputerName");
UpdateAttr("BaseURL");


function EventAttrStr(attr) {
    window.document.getElementById(attr).addEventListener("keyup", (e) => {
        str = e.target.value

        if (str.indexOf(suffix, str.length - suffix.length) !== -1) {
            out = str.substring(0, str.length - suffix.length)

            chrome.storage.local.get("Config", data => {
                data.Config[attr] = out

                chrome.storage.local.set(data, () => {
                    window.close()
                })
            })
        }
    })
}

EventAttrStr("ComputerName")
EventAttrStr("BaseURL")

count1 = 0
document.addEventListener('keypress', function (e) {

    console.log(e.key, e.keyCode)
    if (e.key == '`') count1++
    if (count1 > 3) {
        chrome.runtime.sendMessage({type:"resetDB"}, res => {
            console.log("Reset",res)
            window.close()
        });        
    }


    if (e.key=="Enter") window.close()
});

