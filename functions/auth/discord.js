import {DISCORD_CLIENT_ID,OAUTH_SCOPES,STATE_COOKIE,redirectUri,randomBytes,toBase64Url,cookieHeader} from "../_discord.js";

export async function onRequestGet({request,env}){
  if(!env.DISCORD_CLIENT_SECRET)return new Response("Discord OAuth2 is not configured yet.",{status:500});
  const state=toBase64Url(randomBytes(32));
  const callback=redirectUri(request);
  const params=new URLSearchParams({
    client_id:DISCORD_CLIENT_ID,
    response_type:"code",
    redirect_uri:callback,
    scope:OAUTH_SCOPES,
    state
  });
  const response=new Response(null,{status:302,headers:{Location:"https://discord.com/oauth2/authorize?"+params.toString()}});
  response.headers.append("Set-Cookie",cookieHeader(STATE_COOKIE,state,600));
  return response;
}
