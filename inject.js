/*
 * By garywill (https://garywill.github.io)
 * https://github.com/garywill/multi-subs-yt
 * 
 */

send_ytplayer();
 
//console.log(window.tabid);
if ( ! window.has_executed )
{
    first_run();
    
    window.has_executed = true;
    //console.log("first inject");
    
    
}

function first_run() {
    chrome.runtime.onMessage.addListener( async function(message, sender) {
        //console.log(message, sender);
        
        // Handle request for player info from popup
        if (message.action === "get_player_info") {
            send_ytplayer();
            return;
        }
        
        if ( message.action == "display_sub" )
        {
            var url = message.url;

            var video = document.getElementsByTagName("video")[0];
            subt = document.createElement("track");

            subt.default = true;
            
            if (!message.kill_left)
                subt.src = url;
            else
            {
                var sub_data;
                await fetch(url).then(response => response.text()).then(textString => {
                    sub_data = textString;
                });
                sub_data = sub_data.replaceAll("align:start position:0%", "");
                subt.src = "data:text/vtt," + encodeURIComponent(sub_data, true);
            }
            //subt.srclang = "en";
            video.appendChild(subt);
            subt.track.mode = "showing";
            
            /*
            var st = document.createElement("style");
            st.textContent =`
            ::cue { 
                white-space: pre-wrap;
                color: yellow; 
                text-align: center; 
            } \
            
            `;
            document.head.appendChild(st);
            */
        } else if (message.action == "remove_subs")
        {
            remove_subs();
        }
        
    });
    
    document.addEventListener("yt-navigate-finish", function () {
        remove_subs();
    });
    
}
function remove_subs() {
    var video = document.getElementsByTagName("video")[0];
    Array.from( video.getElementsByTagName("track") ).forEach( function(ele) {
        ele.track.mode = "hidden";
        ele.parentNode.removeChild(ele);
    });
}
async function send_ytplayer(retries = 3) 
{
    
    //console.log(document.title);
    try {
        // Add delay to ensure page is fully loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        get_ytplayer_to_body();
        
        const playerResponse_json = document.body.getAttribute('data-playerResponse');
        //console.log( playerResponse_json );
        
        if (playerResponse_json) {
            chrome.runtime.sendMessage({
                //tabid: window.tabid,
                title: document.title,
                href: window.location.href,
                playerResponse_json: playerResponse_json,
            }).catch(err => console.error("Error sending:", err));
        } else if (retries > 0) {
            // Retry if data not available
            console.log("Player response not found, retrying...", retries);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await send_ytplayer(retries - 1);
        }
    }catch(err) {
        console.error("Error in send_ytplayer:", err);
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await send_ytplayer(retries - 1);
        }
    }
    
    remove_page_change();

}

var script_tag;
function get_ytplayer_to_body()
{
    // Try to extract playerResponse from existing inline script tags instead of
    // injecting an inline script (which violates page CSP).
    function tryParseJSON(str) {
        try { return JSON.parse(str); } catch (e) { return null; }
    }

    // Search page script tags for common YouTube player JSON blobs.
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; ++i) {
        var txt = scripts[i].textContent;
        if (!txt) continue;

        // 1) ytInitialPlayerResponse = { ... };
        var m = txt.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*\})\s*;/);
        if (m) {
            var pr = tryParseJSON(m[1]);
            if (pr) {
                document.body.setAttribute('data-playerResponse', JSON.stringify(pr));
                return;
            }
        }

        // 2) "playerResponse": { ... }
        m = txt.match(/"playerResponse"\s*:\s*(\{[\s\S]*\})/);
        if (m) {
            var pr2 = tryParseJSON(m[1]);
            if (pr2) {
                document.body.setAttribute('data-playerResponse', JSON.stringify(pr2));
                return;
            }
        }

        // 3) ytplayer.config = { ... }
        m = txt.match(/ytplayer\.config\s*=\s*(\{[\s\S]*\})\s*;/);
        if (m) {
            var cfg = tryParseJSON(m[1]);
            if (cfg) {
                if (cfg.args && cfg.args.player_response) {
                    var pr3 = tryParseJSON(cfg.args.player_response);
                    if (pr3) {
                        document.body.setAttribute('data-playerResponse', JSON.stringify(pr3));
                        return;
                    }
                }
            }
        }
    }
}
function remove_page_change()
{
    // Remove temporary attribute if present.
    try {
        document.body.removeAttribute('data-playerResponse');
    } catch (e) {}
    
}

//------------------------------------------------



 

