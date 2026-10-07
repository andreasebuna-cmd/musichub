import {json,cookieValue,decryptSession,SESSION_COOKIE,discordGuildMember,discordGuildRoles} from "../../_discord.js";

export async function onRequestGet({request,env}){
  const session=env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;
  if(!session?.user?.id)return json({authenticated:false},401);
  if(!env.PROFILE_KV)return json({authenticated:true,configured:false,privacy:"private"});
  const raw=await env.PROFILE_KV.get("profile:"+session.user.id);
  let privacy="private";
  try{if(raw)privacy=JSON.parse(raw).privacy==="public"?"public":"private"}catch(error){}
  return json({authenticated:true,configured:true,privacy});
}

export async function onRequestPost({request,env}){
  const session=env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;
  if(!session?.user?.id)return json({error:"Not authenticated."},401);
  if(!env.PROFILE_KV)return json({error:"Profile storage is not configured."},503);
  const member=env.DISCORD_BOT_TOKEN?await discordGuildMember(session.user.id,env.DISCORD_BOT_TOKEN):null;
  if(!member)return json({error:"You must be a server member to change profile visibility."},403);
  let body={};
  try{body=await request.json()}catch(error){}
  const privacy=body.privacy==="public"?"public":"private";
  const existingRaw=await env.PROFILE_KV.get("profile:"+session.user.id);
  let existing={};
  try{if(existingRaw)existing=JSON.parse(existingRaw)}catch(error){}
  let roleNames=Array.isArray(existing.roleNames)?existing.roleNames:[];
  const roles=Array.isArray(member.roles)?member.roles.map(String):[];
  if(env.DISCORD_BOT_TOKEN){
    try{
      const guildRoles=await discordGuildRoles(env.DISCORD_BOT_TOKEN);
      const roleMap=new Map(Array.isArray(guildRoles)?guildRoles.map(role=>[String(role.id),String(role.name||"")]):[]);
      roleNames=roles.map(roleId=>roleMap.get(roleId)).filter(Boolean);
    }catch(error){}
  }
  const profile={
    id:String(session.user.id),
    username:String(session.user.username||""),
    avatar:String(session.user.avatar||""),
    guildMember:true,
    roles,
    roleNames,
    privacy,
    updatedAt:new Date().toISOString()
  };
  await env.PROFILE_KV.put("profile:"+profile.id,JSON.stringify(profile));
  return json({saved:true,privacy});
}

async function discordGuildRoles(botToken){
  const response=await fetch("https://discord.com/api/v10/guilds/1516076494814711850/roles",{headers:{Authorization:"Bot "+botToken}});
  if(!response.ok)throw new Error("Discord roles lookup failed");
  return response.json();
}
