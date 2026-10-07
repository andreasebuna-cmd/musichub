import {json,cookieValue,decryptSession,SESSION_COOKIE,discordGuildMember} from "../../_discord.js";

async function sessionUser(request,env){
  return env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;
}
async function read(env,key,fallback){
  const raw=await env.PROFILE_KV.get(key);
  try{return raw?JSON.parse(raw):fallback}catch(error){return fallback}
}
export async function onRequestPost({request,env}){
  if(!env.PROFILE_KV)return json({error:"Profile storage is not configured."},503);
  const session=await sessionUser(request,env);
  const fromId=String(session?.user?.id||"");
  if(!fromId)return json({error:"Not authenticated."},401);
  const member=env.DISCORD_BOT_TOKEN?await discordGuildMember(fromId,env.DISCORD_BOT_TOKEN):null;
  if(!member)return json({error:"You must be a server member."},403);
  let body={};try{body=await request.json()}catch(error){}
  const toId=String(body.userId||"");
  if(!/^\d{15,25}$/.test(toId)||toId===fromId)return json({error:"Invalid friend target."},400);
  const target=env.DISCORD_BOT_TOKEN?await discordGuildMember(toId,env.DISCORD_BOT_TOKEN):null;
  if(!target)return json({error:"That user is not a Hub member."},404);
  const friends=await read(env,"friends:"+fromId,[]);
  const targetFriends=await read(env,"friends:"+toId,[]);
  if(friends.map(String).includes(toId))return json({status:"friends"});
  const outgoing=await read(env,"friend_requests:"+fromId,[]);
  const incoming=await read(env,"friend_requests:"+toId,[]);
  if(incoming.some(r=>String(r.fromId)===fromId&&r.status==="pending"))return json({status:"pending"});
  if(outgoing.some(r=>String(r.toId)===toId&&r.status==="pending"))return json({status:"pending"});
  const reverse=incoming.find(r=>String(r.fromId)===toId&&r.status==="pending");
  if(reverse)return json({status:"pending"});
  const requestId=crypto.randomUUID();
  outgoing.push({id:requestId,toId,status:"pending",createdAt:new Date().toISOString()});
  incoming.push({id:requestId,fromId,status:"pending",createdAt:new Date().toISOString()});
  await env.PROFILE_KV.put("friend_requests:"+fromId,JSON.stringify(outgoing));
  await env.PROFILE_KV.put("friend_requests:"+toId,JSON.stringify(incoming));
  const notifications=await read(env,"notifications:"+toId,[]);
  notifications.unshift({id:crypto.randomUUID(),type:"friend_request",requestId,fromId,read:false,createdAt:new Date().toISOString()});
  await env.PROFILE_KV.put("notifications:"+toId,JSON.stringify(notifications.slice(0,100)));
  return json({status:"pending"});
}
