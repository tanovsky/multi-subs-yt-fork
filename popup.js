/*
 * By garywill (https://garywill.github.io)
 * https://github.com/garywill/multi-subs-yt
 * 
 */

var onrd = new Array(); //on document ready
document.addEventListener('DOMContentLoaded', async (event) => {

    for (var i=0; i<onrd.length; ++i)
    {
        try{
            await Promise.resolve( onrd[i]() );
        }catch(err){
            console.error(err);
        }
    }
});

var cur_tab;

//var ytplayer;
var playerResponse;
var captionTracks;
var translationLanguages;

// Safely send a message to a tab and return true on success.
async function safeSendMessage(tabId, message) {
    try {
        const res = await chrome.tabs.sendMessage(tabId, message);
        return true;
    } catch (err) {
        // In MV3, sendMessage will throw if receiving end doesn't exist.
        console.warn('safeSendMessage failed:', err);
        const divMsg = document.getElementById('div_message');
        if (divMsg) {
            divMsg.textContent = 'Could not connect to page script. Make sure you are on a YouTube watch page and reload the page.';
            divMsg.style.color = 'red';
        }
        return false;
    }
}

onrd.push(async function(){
    cur_tab = ( await chrome.tabs.query({
        currentWindow: true, active: true
    }) ) [0];

    //console.log (cur_tab.id, cur_tab.title );
    //document.getElementById("div_page_title").textContent = cur_tab.title;
    
    // Trigger content script to send player response
    try {
        await chrome.tabs.sendMessage(cur_tab.id, { action: "get_player_info" });
    } catch (err) {
        console.log("Could not send message to tab:", err);
    }
    
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener(async function(message, sender) { 
        // 
        // console.log("popup receive message", message, sender);
        // console.log(message);
        
        if (!sender || !sender.tab || sender.tab.id !== cur_tab.id) {
            return;
        }

        playerResponse = null;
            //console.log("tab id matches");
            //document.getElementById("div_page_title").textContent = message['title'];
            //ytplayer = JSON.parse(message['ytplayer_json']);
            if (message && message.playerResponse_json) {
                try {
                    playerResponse = JSON.parse(message.playerResponse_json);
                } catch (err) {
                    console.error('Failed to parse playerResponse_json', err);
                    show_refresh();
                    return;
                }
            } else {
                show_refresh();
                return;
            }
            
            document.getElementById("div_connecting_tip").style.display="none";
            
            //console.log(ytplayer);
            //console.log(ytplayer.config);
            if (playerResponse === null || playerResponse === undefined )
            {
                show_refresh();
                return;
            }
            
            //const player_response = ytplayer.config.args.raw_player_response;
            
            var ytplayer_videoid = playerResponse && playerResponse.videoDetails && playerResponse.videoDetails.videoId;
            if ( typeof(ytplayer_videoid) === "string" && cur_tab && cur_tab.url && cur_tab.url.includes( ytplayer_videoid ) )
            {
                //console.log("ytpleyr 与 url 一致");
            }else
                show_refresh();

            parse_ytplayer();
        
    });
    
});

function show_refresh() {
    document.getElementById("div_refresh_tip").style.display="";
    document.getElementById("div_page_title").style.color="orange";
}
function parse_ytplayer()
{
    //const player_response = ytplayer.config.args.raw_player_response;
    
    captionTracks = (playerResponse && playerResponse.captions && playerResponse.captions.playerCaptionsTracklistRenderer && playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks) || [];
    translationLanguages = (playerResponse && playerResponse.captions && playerResponse.captions.playerCaptionsTracklistRenderer && playerResponse.captions.playerCaptionsTracklistRenderer.translationLanguages) || [];
    
    document.getElementById("div_page_title").textContent = (playerResponse && playerResponse.videoDetails && playerResponse.videoDetails.title) ? playerResponse.videoDetails.title : '';
    
    //console.log(captionTracks);
    const selector_sub_lang = document.getElementById("selector-sub-lang");
    selector_sub_lang.innerHTML = "";
    captionTracks.forEach(async function (c, i) {
        var option = document.createElement("option");
        option.setAttribute("value", i);
        
        var text = (c && c.name && c.name.simpleText) ? c.name.simpleText : (c && c.vssId) ? c.vssId : ('track ' + i);
    
        //if (c.isTranslatable)
        //    text += " (Translatable)";
        
        option.textContent = text;
        
        selector_sub_lang.appendChild(option);
        
        try {
            if (await getStor("orig_sub_lang") == c.vssId)
                selector_sub_lang.value = i;
        } catch (e) {}
    });
    
    //console.log(translationLanguages);
    const selector_trans_lang = document.getElementById("selector-trans-lang");
    translationLanguages.forEach(async function (c, i) {
        var option = document.createElement("option");
        option.setAttribute("value", i);
        
        var text = (c && c.languageName && c.languageName.simpleText) ? c.languageName.simpleText : (c && c.languageCode) ? c.languageCode : ('lang ' + i);
        
        option.textContent = text;
        
        selector_trans_lang.appendChild(option);
        
        try {
            if (await getStor("tran_sub_lang") == c.languageCode)
                selector_trans_lang.value = i;
        } catch (e) {}
    });
}

onrd.push( function() {
    document.getElementById("btn_disp_sub").onclick = async function() {

        var url = get_subtitle_url();
        if (!url) return;

        await safeSendMessage(cur_tab.id, {
            action: "display_sub",
            url: url,
            kill_left: true
        });
        
        const selector_sub_lang = document.getElementById("selector-sub-lang");
        const cbox_trans = document.getElementById("cbox_trans");
        const selector_trans_lang = document.getElementById("selector-trans-lang");
        
        var idx = selector_sub_lang.value;
        if (captionTracks && captionTracks[idx] && captionTracks[idx].vssId) {
            var orig_vssid = captionTracks[idx].vssId;
            setStor("orig_sub_lang", orig_vssid);
        }
        //console.log(getStor('orig_sub_lang'));
        
        if ( cbox_trans.checked) {
            var tidx = selector_trans_lang.value;
            if (translationLanguages && translationLanguages[tidx] && translationLanguages[tidx].languageCode) {
                var tran_lang = translationLanguages[tidx].languageCode;
                setStor("tran_sub_lang", tran_lang);
            }
        }
    };
});

onrd.push( function() {
    document.getElementById("btn_rm_sub").onclick = async function() {
        await safeSendMessage(cur_tab.id, {
            action: "remove_subs",
        });
    };
});

onrd.push( function() {
    document.getElementById("btn_url").onclick = function() {
        var url = get_subtitle_url();
        if (!url) return;
        navigator.clipboard.writeText(url);
    };
});

onrd.push(function() {
    const cbox_trans = document.getElementById("cbox_trans");
    const selector_trans_lang = document.getElementById("selector-trans-lang");
    cbox_trans.addEventListener("change", function() {
        if (cbox_trans.checked)
            selector_trans_lang.removeAttribute("disabled");
        else
            selector_trans_lang.setAttribute("disabled", "true");
    });
});

function get_subtitle_url(){
    const selector_sub_lang = document.getElementById("selector-sub-lang");
    const cbox_trans = document.getElementById("cbox_trans");
    const selector_trans_lang = document.getElementById("selector-trans-lang");
    
    var idx = selector_sub_lang.value;
    if (!(captionTracks && captionTracks[idx] && captionTracks[idx].baseUrl)) return null;

    var url = captionTracks[idx].baseUrl + "&fmt=vtt";

    if (cbox_trans.checked)
    {
        var tidx = selector_trans_lang.value;
        if (translationLanguages && translationLanguages[tidx] && translationLanguages[tidx].languageCode) {
            var trans_to_lang_code = translationLanguages[tidx].languageCode;
            url += `&tlang=${trans_to_lang_code}`;
        }
    }
    return url;
}
