import {json,cookieValue,decryptSession,SESSION_COOKIE} from "../../_discord.js";

async function session(request,env){
  return env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;
}
export async function onRequestGet({request,env}){
  if(!env.PROFILE_KV)return json({notifications:[],configured:false});
  const s=await session(request,env);
  const id=String(s?.user?.id||"");
  if(!id)return json({notifications:[]},401);
  const raw=await env.PROFILE_KV.get("notifications:"+id);
  let notifications=[];try{notifications=raw?JSON.parse(raw):[]}catch(error){}
  const requestKeys=new Set(notifications.filter(n=>n.type==="friend_request"&&n.requestId).map(n=>String(n.requestId)));
  const requestStatuses={};
  if(requestKeys.size){
    const fr=await env.PROFILE_KV.get("friend_requests:"+id);
    try{for(const r of (fr?JSON.parse(fr):[])){if(requestKeys.has(String(r.id)))requestStatuses[String(r.id)]=String(r.status||"pending")}}catch(error){}
  }
  const result=notifications.slice(0,50).map(n=>({
    id:String(n.id||""),type:String(n.type||""),requestId:String(n.requestId||""),
    fromId:String(n.fromId||""),read:n.read===true,createdAt:n.createdAt||"",requestStatus:requestStatuses[String(n.requestId)]||""
  }));
  return json({notifications:result,unreadCount:result.filter(n=>!n.read).length});
}
