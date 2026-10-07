import {json,cookieValue,decryptSession,SESSION_COOKIE} from "../../_discord.js";

async function getUserId(request,env){
  const session=env.SESSION_SECRET?await decryptSession(cookieValue(request,SESSION_COOKIE),env.SESSION_SECRET):null;
  return String(session?.user?.id||"");
}

export async function onRequestGet({request,env}){
  if(!env.PROFILE_KV)return new Response("Notifications are not configured.",{status:503});
  const id=await getUserId(request,env);
  if(!id)return new Response("Not authenticated.",{status:401});
  const encoder=new TextEncoder();
  let closed=false;
  const stream=new ReadableStream({
    async start(controller){
      const send=(event,data)=>{
        if(closed)return;
        controller.enqueue(encoder.encode((event?"event: "+event+"\n":"")+"data: "+JSON.stringify(data)+"\n\n"));
      };
      let last="";
      let ticks=0;
      try{
        while(ticks<25&&!closed){
          const raw=await env.PROFILE_KV.get("notifications:"+id);
          let list=[];
          try{list=raw?JSON.parse(raw):[]}catch(error){list=[]}
          const snapshot=JSON.stringify(list.slice(0,50).map(n=>({
            id:String(n.id||""),read:n.read===true,requestId:String(n.requestId||""),status:String(n.status||"")
          })));
          if(snapshot!==last){
            last=snapshot;
            send("",{changed:true});
          }else{
            send("ping",{ts:Date.now()});
          }
          ticks++;
          await new Promise(resolve=>setTimeout(resolve,1000));
        }
      }catch(error){}finally{
        closed=true;
        try{controller.close()}catch(error){}
      }
    },
    cancel(){closed=true;}
  });
  return new Response(stream,{
    headers:{
      "Content-Type":"text/event-stream; charset=utf-8",
      "Cache-Control":"no-cache, no-transform",
      "Connection":"keep-alive"
    }
  });
}
