(function(){
  var lastSignature="";
  function auth(){return typeof isDiscordAuthenticated==="function"&&isDiscordAuthenticated();}
  function css(){
    if(document.getElementById("friends-ui-style"))return;
    var s=document.createElement("style");s.id="friends-ui-style";s.textContent=".notification-wrap{position:relative}.notification-btn{position:relative;width:42px;height:42px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.055);color:#aaa;display:grid;place-items:center;cursor:pointer;transition:.25s var(--ease)}.notification-btn:hover,.notification-btn.open{color:#fff;background:rgba(255,255,255,.1);transform:translateY(-1px)}.notification-btn svg{width:18px;height:18px}.notification-badge{position:absolute;right:-5px;top:-5px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ff6a00;color:#090705;font-size:10px;font-weight:900;display:none;place-items:center;border:2px solid #100e0d}.notification-badge.visible{display:grid}.notification-panel{position:fixed;right:max(20px,calc((100vw - 1020px)/2));top:96px;width:min(380px,calc(100vw - 30px));max-height:430px;overflow:auto;padding:12px;border:1px solid var(--border);border-radius:24px;background:rgba(14,13,12,.68);box-shadow:0 24px 80px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.08);backdrop-filter:blur(28px) saturate(145%);-webkit-backdrop-filter:blur(28px) saturate(145%);opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-10px) scale(.98);transition:.35s var(--ease);z-index:95}.notification-panel.open{opacity:1;visibility:visible;pointer-events:auto;transform:none}.notification-head{display:flex;align-items:center;justify-content:space-between;padding:9px 10px 12px}.notification-head strong{font-size:14px}.notification-list{display:grid;gap:7px}.notification-item{display:flex;align-items:center;gap:10px;padding:11px;border-radius:15px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.06)}.notification-avatar{width:34px;height:34px;border-radius:11px;object-fit:cover;flex:0 0 34px}.notification-copy{min-width:0;flex:1;font-size:11px;line-height:1.45;color:#b8b3ad}.notification-copy strong{color:#f2efeb}.notification-action.accepted{border-color:rgba(80,220,130,.25);background:rgba(80,220,130,.12);color:#74e69a}.friends-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.friend-card{display:flex;align-items:center;gap:14px;padding:16px;border-radius:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.09);cursor:pointer;transition:.28s var(--ease)}.friend-card:hover{transform:translateY(-2px);background:rgba(255,255,255,.075);border-color:rgba(255,106,0,.2)}.friend-avatar{width:52px;height:52px;border-radius:16px;object-fit:cover}.friend-copy{min-width:0}.friend-name{font-size:13px;font-weight:850;color:#f4f1ed}.friend-meta{font-size:10px;color:#77736f;margin-top:4px}.friends-empty{padding:28px;border:1px solid rgba(255,255,255,.08);border-radius:22px;background:rgba(255,255,255,.035);color:#77736f;text-align:center;font-size:12px}@media(max-width:650px){.friends-grid{grid-template-columns:1fr}}.notification-action{border:1px solid rgba(255,106,0,.24);background:rgba(255,106,0,.09);color:#ff9a55;border-radius:11px;padding:8px 10px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap}.notification-empty{padding:25px 12px;text-align:center;color:#77736f;font-size:11px}.hub-toast{position:fixed;right:24px;bottom:24px;z-index:180;width:min(370px,calc(100vw - 30px));padding:13px 15px;display:flex;align-items:center;gap:11px;border:1px solid rgba(255,255,255,.13);border-radius:18px;background:rgba(14,13,12,.68);box-shadow:0 24px 70px rgba(0,0,0,.42),inset 0 1px rgba(255,255,255,.08);backdrop-filter:blur(28px) saturate(145%);-webkit-backdrop-filter:blur(28px) saturate(145%);transform:translateY(18px) translateX(20px);opacity:0;pointer-events:none;transition:.45s var(--ease)}.hub-toast.show{transform:none;opacity:1}.hub-toast-icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,106,0,.11);color:#ff914f;border:1px solid rgba(255,106,0,.18);flex:0 0 34px}.hub-toast-copy{font-size:11px;line-height:1.45;color:#aaa6a1}.hub-toast-copy strong{display:block;color:#f4f1ed;font-size:12px;margin-bottom:2px}.friend-action{margin-top:16px}.friend-action .btn{padding:12px 15px;font-size:11px}.friend-action .btn[disabled]{opacity:.55;cursor:default;transform:none}.friend-action .btn.friend-added{background:rgba(255,255,255,.07);color:#aaa}.friend-action .btn.friend-requested{background:rgba(255,106,0,.08);color:#ff9a55}.friend-action .friend-danger{margin-left:8px;background:rgba(255,255,255,.045);color:#aaa;border-color:rgba(255,255,255,.1)}.friend-action .friend-danger:hover{color:#ff8a78;border-color:rgba(255,100,80,.25);background:rgba(255,90,70,.08)}";
    document.head.appendChild(s);
  }
  function addBell(){
    if(document.getElementById("notification-btn"))return;
    var settings=document.getElementById("settings-btn");if(!settings)return;
    var wrap=document.createElement("div");wrap.className="notification-wrap";
    wrap.innerHTML='<button class="notification-btn" id="notification-btn" aria-label="Notifications" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg><span class="notification-badge" id="notification-badge">0</span></button>';
    settings.parentElement.parentElement.insertBefore(wrap,settings.parentElement);
    wrap.firstElementChild.addEventListener("click",toggleNotifications);
  }
  function addPanels(){
    if(!document.getElementById("notification-panel")){
      var p=document.createElement("div");p.className="notification-panel";p.id="notification-panel";p.innerHTML='<div class="notification-head"><strong>Notifications</strong><span id="notification-panel-count" class="search-suggestion-meta"></span></div><div class="notification-list" id="notification-list"><div class="notification-empty">No notifications</div></div>';document.body.appendChild(p);
    }
    if(!document.getElementById("hub-toast")){
      var t=document.createElement("div");t.className="hub-toast";t.id="hub-toast";t.innerHTML='<div class="hub-toast-icon">!</div><div class="hub-toast-copy"><strong>New notification</strong><span id="hub-toast-text">You have a new notification.</span></div>';document.body.appendChild(t);
    }
  }
  function toast(text){var t=document.getElementById("hub-toast"),x=document.getElementById("hub-toast-text");if(!t||!x)return;x.textContent=text;t.classList.add("show");clearTimeout(window.__hubToast);window.__hubToast=setTimeout(function(){t.classList.remove("show")},5200)}
  async function loadNotifications(showToast){
    if(!auth())return;
    try{
      var r=await fetch("/api/notifications",{credentials:"same-origin",cache:"no-store"});if(!r.ok)return;
      var d=await r.json(),list=Array.isArray(d.notifications)?d.notifications:[],unread=Number(d.unreadCount||0);
      var b=document.getElementById("notification-badge");if(b){b.textContent=unread>99?"99+":String(unread);b.classList.toggle("visible",unread>0)}
      var c=document.getElementById("notification-panel-count");if(c)c.textContent=unread?unread+" unread":"";
      var root=document.getElementById("notification-list");
      if(root){
        root.innerHTML=list.length?list.map(function(n){return '<div class="notification-item"><img class="notification-avatar" data-n="'+escapeHtml(n.fromId)+'" src="https://cdn.discordapp.com/embed/avatars/0.png" alt=""><div class="notification-copy"><strong data-name="'+escapeHtml(n.fromId)+'">Hub member</strong>'+(n.type==="friend_request"?" sent you a friend request.":" accepted your friend request.")+'</div>'+(n.type==="friend_request"&&n.requestId?(n.requestStatus==="accepted"?'<button class="notification-action accepted" disabled>Accepted</button>':'<button class="notification-action" data-request="'+escapeHtml(n.requestId)+'">Accept</button>'):"")+'</div>'}).join(""):'<div class="notification-empty">No notifications</div>';
        root.querySelectorAll("[data-request]").forEach(function(btn){btn.addEventListener("click",function(){respond(btn.dataset.request,"accept")})});
        list.slice(0,20).forEach(async function(n){try{var q=await fetch("/api/profiles/view?id="+encodeURIComponent(n.fromId),{credentials:"same-origin",cache:"no-store"}),z=await q.json(),p=z.profile;if(!p)return;var name=p.username||p.displayName||"Private Username",ne=root.querySelector('[data-name="'+n.fromId+'"]'),im=root.querySelector('[data-n="'+n.fromId+'"]');if(ne)ne.textContent=name;if(im&&p.avatar)im.src=p.avatar}catch(e){}});
      }
      var sig=list.filter(function(n){return !n.read}).map(function(n){return n.id}).join("|");
      if(showToast&&lastSignature&&sig!==lastSignature)toast(unread===1?"You have a new notification.":"You have "+unread+" new notifications.");
      lastSignature=sig;
    }catch(e){}
  }
  function toggleNotifications(){
    if(!auth())return;var p=document.getElementById("notification-panel"),b=document.getElementById("notification-btn");if(!p||!b)return;
    var open=!p.classList.contains("open");p.classList.toggle("open",open);b.classList.toggle("open",open);b.setAttribute("aria-expanded",open?"true":"false");if(open){var badge=document.getElementById("notification-badge");if(badge){badge.textContent="0";badge.classList.remove("visible")}var count=document.getElementById("notification-panel-count");if(count)count.textContent="";fetch("/api/notifications",{method:"POST",credentials:"same-origin",cache:"no-store"}).catch(function(){});loadNotifications(false);}
  }
  async function sendFriend(id,button){
    button.disabled=true;try{var r=await fetch("/api/friends/request",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:id})}),d=await r.json();button.textContent=d.status==="friends"?"✓ Friends":"Request sent";button.classList.add(d.status==="friends"?"friend-added":"friend-requested")}catch(e){button.disabled=false}
  }
  async function respond(id,action){try{var r=await fetch("/api/friends/respond",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:id,action:action})});if(r.ok){var d=await r.json();var b=document.querySelector('[data-request="'+id+'"]');if(b){b.textContent="Accepted";b.disabled=true;b.classList.add("accepted");b.removeAttribute("data-request")}loadNotifications(false)}}catch(e){}}
  async function friendAction(action,id,button){
    if(button)button.disabled=true;
    try{var r=await fetch("/api/friends/respond",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:action,userId:id})}),d=await r.json().catch(function(){return{}});if(!r.ok)throw new Error(d.error||"Action failed");
      if(action==="remove"&&button){button.textContent="Removed";button.classList.add("friend-danger")}
      if(action==="block"&&button){button.textContent="Blocked";button.classList.add("friend-danger")}
      if(action==="block")setTimeout(function(){if(typeof showPage==="function")showPage("friends")},350);
      if(typeof window.loadFriendsPage==="function"&&document.getElementById("friends")?.classList.contains("active"))window.loadFriendsPage();
    }catch(e){if(button){button.disabled=false;button.textContent=action==="block"?"Block":"Remove friend"}}
  }
  async function loadFriendsPage(){
    var root=document.getElementById("friends-content");
    if(!root||!auth())return;
    root.innerHTML='<div class="friends-empty">Loading friends…</div>';
    try{
      var r=await fetch("/api/friends/list",{credentials:"same-origin",cache:"no-store"});
      var d=await r.json().catch(function(){return{}});
      if(!r.ok)throw new Error(d.error||"Could not load friends");
      var friends=Array.isArray(d.friends)?d.friends:[];
      if(!friends.length){
        root.innerHTML='<div class="friends-empty">You do not have any friends yet.</div>';
        return;
      }
      root.innerHTML='<div class="friends-grid">'+friends.map(function(p){
        var avatar=p.avatar||"https://cdn.discordapp.com/embed/avatars/0.png";
        var name=p.displayName||p.username||"Hub member";
        return '<button type="button" class="friend-card" data-friend-id="'+escapeHtml(String(p.id))+'"><img class="friend-avatar" src="'+escapeHtml(avatar)+'" alt=""><span class="friend-copy"><span class="friend-name">'+escapeHtml(name)+'</span><span class="friend-meta">Friend</span></span></button>';
      }).join("")+'</div>';
      root.querySelectorAll("[data-friend-id]").forEach(function(button){
        button.addEventListener("click",function(){
          var id=button.dataset.friendId;
          if(typeof showPage==="function")showPage("profil");
          if(typeof openMemberProfile==="function")openMemberProfile(id);
        });
      });
    }catch(error){
      root.innerHTML='<div class="friends-empty">Could not load your friends.</div>';
    }
  }
  window.loadFriendsPage=loadFriendsPage;
  function patchProfile(){
    if(typeof window.renderViewedProfile!=="function"||window.renderViewedProfile.__friendsPatched)return;
    var original=window.renderViewedProfile;
    window.renderViewedProfile=function(profile){
      original(profile);
      var root=document.getElementById("profile-content");if(!root)return;
      var card=root.querySelector(".profile-card");if(!card)return;
      var owner=auth()&&String(discordUser.id)===String(profile.id);
      if(!owner){
        var actions=document.createElement("div");actions.className="friend-action";
        if(profile.friendship==="friends"){
          var remove=document.createElement("button");remove.className="btn friend-danger";remove.type="button";remove.textContent="Remove friend";remove.onclick=function(){friendAction("remove",profile.id,remove)};
          var block=document.createElement("button");block.className="btn friend-danger";block.type="button";block.textContent="Block";block.onclick=function(){if(confirm("Block this person?"))friendAction("block",profile.id,block)};
          actions.append(remove,block);
        }else if(profile.friendship==="pending"){
          var pending=document.createElement("button");pending.className="btn friend-requested";pending.type="button";pending.textContent="Request sent";pending.disabled=true;actions.appendChild(pending);
          var blockPending=document.createElement("button");blockPending.className="btn friend-danger";blockPending.type="button";blockPending.textContent="Block";blockPending.onclick=function(){if(confirm("Block this person?"))friendAction("block",profile.id,blockPending)};actions.appendChild(blockPending);
        }else{
          var add=document.createElement("button");add.className="btn";add.type="button";add.textContent="Add friend";add.onclick=function(){sendFriend(profile.id,add)};actions.appendChild(add);
          var blockOther=document.createElement("button");blockOther.className="btn friend-danger";blockOther.type="button";blockOther.textContent="Block";blockOther.onclick=function(){if(confirm("Block this person?"))friendAction("block",profile.id,blockOther)};actions.appendChild(blockOther);
        }
        card.appendChild(actions);
      }
      var name=card.querySelector(".profile-name");if(name&&profile.privacy==="private"&&!owner)name.textContent=profile.username||profile.displayName||"Private Username";
    };
    window.renderViewedProfile.__friendsPatched=true;
  }
  function patchSession(){
    if(typeof window.setDiscordUser!=="function"||window.setDiscordUser.__friendsPatched)return;
    var original=window.setDiscordUser;
    window.setDiscordUser=function(user){original(user);setTimeout(function(){loadNotifications(false)},50)};
    window.setDiscordUser.__friendsPatched=true;
  }
  var notificationStream=null;
  function connectNotificationStream(){
    if(!auth()||typeof EventSource==="undefined")return;
    if(notificationStream){try{notificationStream.close()}catch(e){}}
    try{
      notificationStream=new EventSource("/api/notifications/stream");
      notificationStream.onmessage=function(){loadNotifications(true)};
      notificationStream.onerror=function(){
        if(notificationStream){try{notificationStream.close()}catch(e){}}
        notificationStream=null;
        if(auth())setTimeout(connectNotificationStream,1800);
      };
    }catch(e){notificationStream=null}
  }
  function init(){
    css();addBell();addPanels();patchProfile();patchSession();
    document.addEventListener("click",function(e){var p=document.getElementById("notification-panel");if(p&&!e.target.closest("#notification-panel")&&!e.target.closest("#notification-btn"))p.classList.remove("open")});
    setTimeout(function(){patchProfile();patchSession();loadNotifications(false);connectNotificationStream();setInterval(function(){patchProfile();patchSession();loadNotifications(true)},5000)},1000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();