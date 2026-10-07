import {json,cookieValue,decryptSession,SESSION_COOKIE,discordGuildMember} from "../../_discord.js";
async function read(env,key,fallback){const raw=await env.PROFILE_KV.get(key);try{return raw?JSON.parse(raw):fallback}catch(error){return fallback}}
export async function onRequestGet({request,env}){
  if(!env.PROFILE_KV)return json({friends:[]},503);
  const session=env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;
  const userId=String(session?.user?.id||"");if(!userId)return json({friends:[]},401);
  if(env.DISCORD_BOT_TOKEN&&!await discordGuildMember(userId,env.DISCORD_BOT_TOKEN))return json({friends:[]},403);
  const blocked=new Set((await read(env,"blocked:"+userId,[])).map(String));
  const ids=(await read(env,"friends:"+userId,[])).map(String).filter(id=>!blocked.has(id));
  const friends=[];
  for(const id of ids){
    const raw=await env.PROFILE_KV.get("profile:"+id);if(!raw)continue;
    try{const p=JSON.parse(raw);if(!p.guildMember||blocked.has(id))continue;if(env.DISCORD_BOT_TOKEN&&!await discordGuildMember(id,env.DISCORD_BOT_TOKEN))continue;
      friends.push({id,displayName:String(p.displayName||""),username:String(p.username||""),avatar:String(p.avatar||"")});
    }catch(error){}
  }
  return json({friends});
}