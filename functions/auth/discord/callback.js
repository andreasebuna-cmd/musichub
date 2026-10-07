import {
  DISCORD_CLIENT_ID,DISCORD_GUILD_ID,STATE_COOKIE,SESSION_COOKIE,
  redirectUri,cookieValue,cookieHeader,clearCookieHeader,json,
  discordFetch,discordUser,discordGuildMember,avatarUrl,encryptSession
} from "../../_discord.js";

export async function onRequestGet({request,env}){
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const state=url.searchParams.get("state");
  const expectedState=cookieValue(request,STATE_COOKIE);
  if(!code||!state||!expectedState||state!==expectedState){
    return new Response("OAuth2 state validation failed.",{status:400});
  }
  if(!env.DISCORD_CLIENT_SECRET||!env.DISCORD_BOT_TOKEN||!env.SESSION_SECRET){
    return new Response("Discord authentication is not configured on the server.",{status:500});
  }

  const tokenBody=new URLSearchParams({
    client_id:DISCORD_CLIENT_ID,
    client_secret:env.DISCORD_CLIENT_SECRET,
    grant_type:"authorization_code",
    code,
    redirect_uri:redirectUri(request)
  });
  const tokenResponse=await discordFetch("/oauth2/token",{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:tokenBody
  });
  if(!tokenResponse.ok)return new Response("Discord OAuth2 token exchange failed.",{status:502});

  const token=await tokenResponse.json();
  const user=await discordUser(token.access_token);
  const member=await discordGuildMember(user.id,env.DISCORD_BOT_TOKEN);

  if(!member){
    const headers=new Headers({Location:"/?discord=not-member#home","Cache-Control":"no-store"});
    headers.append("Set-Cookie",clearCookieHeader(STATE_COOKIE));
    headers.append("Set-Cookie",clearCookieHeader(SESSION_COOKIE));
    return new Response(null,{status:302,headers});
  }

  const roles=Array.isArray(member.roles)?member.roles.map(String):[];
  const sessionUser={
    id:String(user.id),
    username:String(user.username||""),
    avatar:avatarUrl(user),
    guildMember:true,
    roles
  };
  const session=await encryptSession({user:sessionUser,guildId:DISCORD_GUILD_ID},env.SESSION_SECRET);
  const headers=new Headers({Location:"/#home","Cache-Control":"no-store"});
  headers.append("Set-Cookie",cookieHeader(SESSION_COOKIE,session,60*60*24*7));
  headers.append("Set-Cookie",clearCookieHeader(STATE_COOKIE));
  return new Response(null,{status:302,headers});
}
