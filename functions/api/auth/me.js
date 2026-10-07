import {SESSION_COOKIE,cookieValue,decryptSession,json,cookieHeader,discordGuildMember,discordGuildRoles,encryptSession} from "../../_discord.js";

export async function onRequestGet({request,env}){
  if(!env.SESSION_SECRET)return json({authenticated:false},200);
  const value=cookieValue(request,SESSION_COOKIE);
  if(!value)return json({authenticated:false});
  const session=await decryptSession(value,env.SESSION_SECRET);
  if(!session?.user?.id)return json({authenticated:false});

  let user={...session.user};
  try{
    const member=env.DISCORD_BOT_TOKEN?await discordGuildMember(user.id,env.DISCORD_BOT_TOKEN):null;
    user.guildMember=Boolean(member);
    user.roles=Array.isArray(member?.roles)?member.roles.map(String):[];
    user.roleNames=[];
    if(member&&env.DISCORD_BOT_TOKEN){
      try{
        const guildRoles=await discordGuildRoles(env.DISCORD_BOT_TOKEN);
        const roleMap=new Map(Array.isArray(guildRoles)?guildRoles.map(role=>[String(role.id),String(role.name||"")]):[]);
        user.roleNames=user.roles.map(roleId=>roleMap.get(roleId)).filter(Boolean);
      }catch(error){}
    }
  }catch(error){}

  if(user.guildMember&&env.PROFILE_KV){
    const existingRaw=await env.PROFILE_KV.get("profile:"+user.id);
    let existing={};
    try{if(existingRaw)existing=JSON.parse(existingRaw)}catch(error){}
    await env.PROFILE_KV.put("profile:"+user.id,JSON.stringify({
      id:user.id,
      username:user.username,
      displayName:user.displayName||"",
      avatar:user.avatar,
      guildMember:true,
      roles:user.roles||[],
      roleNames:user.roleNames||[],
      privacy:existing.privacy==="public"?"public":"private",
      updatedAt:new Date().toISOString()
    }));
  }

  const updatedSession=await encryptSession({user,guildId:session.guildId},env.SESSION_SECRET);
  const headers=new Headers();
  headers.append("Set-Cookie",cookieHeader(SESSION_COOKIE,updatedSession,60*60*24*7));
  return json({authenticated:true,user},200,headers);
}
