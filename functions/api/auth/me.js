import {SESSION_COOKIE,cookieValue,decryptSession,json} from "../../../_discord.js";

export async function onRequestGet({request,env}){
  if(!env.SESSION_SECRET)return json({authenticated:false},200);
  const value=cookieValue(request,SESSION_COOKIE);
  if(!value)return json({authenticated:false});
  const session=await decryptSession(value,env.SESSION_SECRET);
  if(!session?.user?.guildMember)return json({authenticated:false});
  return json({authenticated:true,user:session.user});
}
