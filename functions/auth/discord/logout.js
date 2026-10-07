import {SESSION_COOKIE,STATE_COOKIE,clearCookieHeader,json} from "../../_discord.js";

export async function onRequestPost(){
  const response=json({ok:true});
  response.headers.append("Set-Cookie",clearCookieHeader(SESSION_COOKIE));
  response.headers.append("Set-Cookie",clearCookieHeader(STATE_COOKIE));
  return response;
}
export async function onRequestGet({request}){
  const url=new URL(request.url);
  const headers=new Headers({Location:"/#home","Cache-Control":"no-store"});
  headers.append("Set-Cookie",clearCookieHeader(SESSION_COOKIE));
  headers.append("Set-Cookie",clearCookieHeader(STATE_COOKIE));
  return new Response(null,{status:302,headers});
}
