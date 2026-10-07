import {json} from "../../_discord.js";

export async function onRequestGet({request,env}){
  if(!env.PROFILE_KV)return json({profiles:[],configured:false});
  const q=(new URL(request.url).searchParams.get("q")||"").trim().toLowerCase();
  if(q.length<1)return json({profiles:[]});
  const listed=await env.PROFILE_KV.list({prefix:"profile:"});
  const keys=listed.keys||[];
  const profiles=[];
  for(let i=0;i<keys.length;i+=100){
    const batch=keys.slice(i,i+100).map(item=>item.name);
    const values=await env.PROFILE_KV.get(batch);
    for(const key of batch){
      const raw=values.get(key);
      if(!raw)continue;
      try{
        const profile=JSON.parse(raw);
        const username=String(profile.username||"");
        const displayName=String(profile.displayName||"");
        if(!profile.guildMember||(!username.toLowerCase().includes(q)&&!displayName.toLowerCase().includes(q)))continue;
        profiles.push({
          id:String(profile.id),
          username,
          displayName,
          avatar:String(profile.avatar||""),
          privacy:profile.privacy==="public"?"public":"private"
        });
      }catch(error){}
    }
  }
  profiles.sort((a,b)=>a.username.localeCompare(b.username));
  return json({profiles:profiles.slice(0,30),configured:true});
}
