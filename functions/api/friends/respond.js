import {json,cookieValue,decryptSession,SESSION_COOKIE,discordGuildMember} from "../../_discord.js";

async function read(env,key,fallback){
  const raw=await env.PROFILE_KV.get(key);
  try{return raw?JSON.parse(raw):fallback}catch(error){return fallback}
}
export async function onRequestPost({request,env}){
  if(!env.PROFILE_KV)return json({error:"Profile storage is not configured."},503);
  const s=env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;
  const userId=String(s?.user?.id||"");
  if(!userId)return json({error:"Not authenticated."},401);
  const member=env.DISCORD_BOT_TOKEN?await discordGuildMember(userId,env.DISCORD_BOT_TOKEN):null;
  if(!member)return json({error:"You must be a server member."},403);
  let body={};try{body=await request.json()}catch(error){}
  const requestId=String(body.requestId||"");
  const action=body.action==="accept"?"accept":"decline";
  if(!requestId)return json({error:"Invalid request."},400);

  const incoming=await read(env,"friend_requests:"+userId,[]);
  const req=incoming.find(r=>String(r.id)===requestId&&r.status==="pending");
  if(!req)return json({error:"Friend request not found."},404);
  const fromId=String(req.fromId);
  const fromMember=env.DISCORD_BOT_TOKEN?await discordGuildMember(fromId,env.DISCORD_BOT_TOKEN):null;
  if(!fromMember)return json({error:"That member is no longer in the Hub."},404);

  req.status=action==="accept"?"accepted":"declined";
  req.respondedAt=new Date().toISOString();
  await env.PROFILE_KV.put("friend_requests:"+userId,JSON.stringify(incoming));

  const outgoing=await read(env,"friend_requests:"+fromId,[]);
  const reverse=outgoing.find(r=>String(r.id)===requestId);
  if(reverse){reverse.status=req.status;reverse.respondedAt=req.respondedAt;await env.PROFILE_KV.put("friend_requests:"+fromId,JSON.stringify(outgoing));}

  const notifications=await read(env,"notifications:"+userId,[]);
  for(const n of notifications){if(String(n.requestId)===requestId)n.read=true;}
  await env.PROFILE_KV.put("notifications:"+userId,JSON.stringify(notifications));

  if(action==="accept"){
    const friends=await read(env,"friends:"+userId,[]);
    const fromFriends=await read(env,"friends:"+fromId,[]);
    if(!friends.map(String).includes(fromId))friends.push(fromId);
    if(!fromFriends.map(String).includes(userId))fromFriends.push(userId);
    await env.PROFILE_KV.put("friends:"+userId,JSON.stringify(friends));
    await env.PROFILE_KV.put("friends:"+fromId,JSON.stringify(fromFriends));
    const otherNotifications=await read(env,"notifications:"+fromId,[]);
    otherNotifications.unshift({id:crypto.randomUUID(),type:"friend_accepted",fromId:userId,read:false,createdAt:new Date().toISOString()});
    await env.PROFILE_KV.put("notifications:"+fromId,JSON.stringify(otherNotifications.slice(0,100)));
  }
  return json({saved:true,status:req.status});
}
