const DISCORD_API="https://discord.com/api/v10";
const DISCORD_CLIENT_ID="1557484435333456094";
const DISCORD_GUILD_ID="1516076494814711850";
const MODERATION_ROLE_IDS=new Set([
  "1516081430562738296",
  "1516128584173879316",
  "1516128742622101514",
  "1516128860645752832"
]);
const OAUTH_SCOPES="identify guilds";
const SESSION_COOKIE="amh_session";
const STATE_COOKIE="amh_oauth_state";
const SESSION_TTL=60*60*24*7;

function redirectUri(request){
  return new URL("/auth/discord/callback",request.url).toString();
}
function randomBytes(length){
  const bytes=new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}
function toBase64Url(bytes){
  let binary="";
  for(const b of bytes)binary+=String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function fromBase64Url(value){
  const normalized=value.replace(/-/g,"+").replace(/_/g,"/");
  const padded=normalized+"=".repeat((4-normalized.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
async function cryptoKey(secret){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw",digest,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
async function encryptSession(payload,secret){
  const iv=randomBytes(12);
  const key=await cryptoKey(secret);
  const data=new TextEncoder().encode(JSON.stringify({exp:Date.now()+SESSION_TTL*1000,...payload}));
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,data));
  const combined=new Uint8Array(iv.length+encrypted.length);
  combined.set(iv);combined.set(encrypted,iv.length);
  return toBase64Url(combined);
}
async function decryptSession(value,secret){
  try{
    const combined=fromBase64Url(value);
    if(combined.length<13)return null;
    const iv=combined.slice(0,12);
    const encrypted=combined.slice(12);
    const key=await cryptoKey(secret);
    const data=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,encrypted);
    const session=JSON.parse(new TextDecoder().decode(data));
    if(!session.exp||session.exp<Date.now())return null;
    return session;
  }catch(error){return null;}
}
function cookieValue(request,name){
  const header=request.headers.get("Cookie")||"";
  for(const part of header.split(";")){
    const index=part.indexOf("=");
    if(index<0)continue;
    if(part.slice(0,index).trim()===name)return decodeURIComponent(part.slice(index+1).trim());
  }
  return null;
}
function cookieHeader(name,value,maxAge){
  return name+"="+encodeURIComponent(value)+"; Max-Age="+maxAge+"; Path=/; HttpOnly; Secure; SameSite=Lax";
}
function clearCookieHeader(name){
  return cookieHeader(name,"",-1);
}
function json(data,status=200,extraHeaders={}){
  return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...extraHeaders}});
}
async function discordFetch(path,options={}){
  return fetch(DISCORD_API+path,options);
}
async function discordUser(accessToken){
  const response=await discordFetch("/users/@me",{headers:{Authorization:"Bearer "+accessToken}});
  if(!response.ok)throw new Error("Discord user lookup failed: "+response.status);
  return response.json();
}
async function discordGuildMember(userId,botToken){
  const response=await discordFetch("/guilds/"+DISCORD_GUILD_ID+"/members/"+encodeURIComponent(userId),{headers:{Authorization:"Bot "+botToken}});
  if(response.status===404)return null;
  if(!response.ok)throw new Error("Discord guild member lookup failed: "+response.status);
  return response.json();
}
async function discordGuildRoles(botToken){
  const response=await discordFetch("/guilds/"+DISCORD_GUILD_ID+"/roles",{headers:{Authorization:"Bot "+botToken}});
  if(!response.ok)throw new Error("Discord guild roles lookup failed: "+response.status);
  return response.json();
}
function avatarUrl(user){
  if(!user.avatar)return "https://cdn.discordapp.com/embed/avatars/0.png";
  return "https://cdn.discordapp.com/avatars/"+user.id+"/"+user.avatar+".png?size=128";
}
export {
  DISCORD_CLIENT_ID,DISCORD_GUILD_ID,MODERATION_ROLE_IDS,OAUTH_SCOPES,
  SESSION_COOKIE,STATE_COOKIE,SESSION_TTL,redirectUri,randomBytes,toBase64Url,
  cookieValue,cookieHeader,clearCookieHeader,json,encryptSession,decryptSession,
  discordFetch,discordUser,discordGuildMember,discordGuildRoles,avatarUrl
};
