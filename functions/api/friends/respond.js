import {json,cookieValue,decryptSession,SESSION_COOKIE,discordGuildMember} from "../../_discord.js";

async function read(env,key,fallback){const raw=await env.PROFILE_KV.get(key);try{return raw?JSON.parse(raw):fallback}catch(error){return fallback}}
async function userId(request,env){const s=env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;return String(s?.user?.id||"")}
export async function onRequestPost({request,env}){
  if(!env.PROFILE_KV)return json({error:"Profile storage is not configured."},503);
  const uid=await userId(request,env);if(!uid)return json({error:"Not authenticated."},401);
  if(env.DISCORD_BOT_TOKEN&&!await discordGuildMember(uid,env.DISCORD_BOT_TOKEN))return json({error:"You must be a server member."},403);
  let body={};try{body=await request.json()}catch(error){}
  const action=String(body.action||"");const targetId=String(body.userId||"");const requestId=String(body.requestId||"");

  if(action==="remove"){
    if(!/^\d{15,25}$/.test(targetId)||targetId===uid)return json({error:"Invalid friend target."},400);
    const friends=await read(env,"friends:"+uid,[]);const other=await read(env,"friends:"+targetId,[]);
    if(!friends.map(String).includes(targetId))return json({error:"Not friends."},404);
    await env.PROFILE_KV.put("friends:"+uid,JSON.stringify(friends.filter(x=>String(x)!==targetId)));
    await env.PROFILE_KV.put("friends:"+targetId,JSON.stringify(other.filter(x=>String(x)!==uid)));
    return json({status:"removed"});
  }

  if(action==="block"){
    if(!/^\d{15,25}$/.test(targetId)||targetId===uid)return json({error:"Invalid user."},400);
    const blocked=await read(env,"blocked:"+uid,[]);
    if(!blocked.map(String).includes(targetId))blocked.push(targetId);
    const friends=await read(env,"friends:"+uid,[]);
    const other=await read(env,"friends:"+targetId,[]);
    await env.PROFILE_KV.put("blocked:"+uid,JSON.stringify(blocked));
    await env.PROFILE_KV.put("friends:"+uid,JSON.stringify(friends.filter(x=>String(x)!==targetId)));
    await env.PROFILE_KV.put("friends:"+targetId,JSON.stringify(other.filter(x=>String(x)!==uid)));
    return json({status:"blocked"});
  }

  if(action!=="accept"&&action!=="decline")return json({error:"Invalid action."},400);
  if(!requestId)return json({error:"Invalid request."},400);
  const incoming=await read(env,"friend_requests:"+uid,[]);
  const req=incoming.find(r=>String(r.id)===requestId&&r.status==="pending");
  if(!req)return json({error:"Friend request not found."},404);
  const fromId=String(req.fromId);
  if(env.DISCORD_BOT_TOKEN&&!await discordGuildMember(fromId,env.DISCORD_BOT_TOKEN))return json({error:"That member is no longer in the Hub."},404);
  req.status=action==="accept"?"accepted":"declined";req.respondedAt=new Date().toISOString();
  await env.PROFILE_KV.put("friend_requests:"+uid,JSON.stringify(incoming));
  const outgoing=await read(env,"friend_requests:"+fromId,[]);const reverse=outgoing.find(r=>String(r.id)===requestId);
  if(reverse){reverse.status=req.status;reverse.respondedAt=req.respondedAt;await env.PROFILE_KV.put("friend_requests:"+fromId,JSON.stringify(outgoing))}
  const notifications=await read(env,"notifications:"+uid,[]);
  for(const n of notifications){if(String(n.requestId)===requestId)n.read=true}
  await env.PROFILE_KV.put("notifications:"+uid,JSON.stringify(notifications));
  if(action==="accept"){
    const friends=await read(env,"friends:"+uid,[]);const fromFriends=await read(env,"friends:"+fromId,[]);
    if(!friends.map(String).includes(fromId))friends.push(fromId);if(!fromFriends.map(String).includes(uid))fromFriends.push(uid);
    await env.PROFILE_KV.put("friends:"+uid,JSON.stringify(friends));await env.PROFILE_KV.put("friends:"+fromId,JSON.stringify(fromFriends));
    const otherNotifications=await read(env,"notifications:"+fromId,[]);
    otherNotifications.unshift({id:crypto.randomUUID(),type:"friend_accepted",fromId:uid,read:false,createdAt:new Date().toISOString()});
    await env.PROFILE_KV.put("notifications:"+fromId,JSON.stringify(otherNotifications.slice(0,100)));
  }
  return json({saved:true,status:req.status});
}