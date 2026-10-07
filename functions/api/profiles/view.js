import {json,cookieValue,decryptSession,SESSION_COOKIE,discordGuildMember} from "../../_discord.js";

export async function onRequestGet({request,env}){
  if(!env.PROFILE_KV)return json({profile:null,configured:false});
  const id=(new URL(request.url).searchParams.get("id")||"").trim();
  if(!/^\d{15,25}$/.test(id))return json({profile:null},400);
  const raw=await env.PROFILE_KV.get("profile:"+id);
  if(!raw)return json({profile:null},404);
  let profile;
  try{profile=JSON.parse(raw)}catch(error){return json({profile:null},404)}
  if(!profile.guildMember)return json({profile:null},404);
  if(env.DISCORD_BOT_TOKEN){
    try{
      const member=await discordGuildMember(id,env.DISCORD_BOT_TOKEN);
      if(!member)return json({profile:null},404);
    }catch(error){}
  }

  const viewerSession=env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;
  const viewerId=String(viewerSession?.user?.id||"");
  const isOwner=viewerId===id;
  let viewerFriends=[]; if(viewerId){try{const friendsRaw=await env.PROFILE_KV.get("friends:"+viewerId);viewerFriends=friendsRaw?JSON.parse(friendsRaw):[]}catch(error){}}
  const areFriends=viewerFriends.map(String).includes(id);
  let displayName=String(profile.displayName||"");
  if(env.DISCORD_BOT_TOKEN){try{const liveMember=await discordGuildMember(id,env.DISCORD_BOT_TOKEN);displayName=String(liveMember?.user?.global_name||displayName||"")}catch(error){}}
  const publicProfile={
    id:String(profile.id),
    username:String(profile.username||""),
    displayName,
    avatar:String(profile.avatar||""),
    guildMember:true,
    privacy:profile.privacy==="public"?"public":"private",
    friendship:isOwner?"self":(areFriends?"friends":"none")
  };
  if(profile.privacy==="public"||isOwner||areFriends){
    publicProfile.roles=Array.isArray(profile.roles)?profile.roles:[];
    publicProfile.roleNames=Array.isArray(profile.roleNames)?profile.roleNames:[];
    publicProfile.onlineStatus="Online status unavailable";
  }
  return json({profile:publicProfile});
}
