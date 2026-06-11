(function(){
  'use strict';
  let msgStore=[],msgIds=new Set(),storeConvId=null,globalSub=null;
  const esc=s=>(window.escHTML||(x=>String(x??'')))(s);
  function renderStore(){
    const el=document.getElementById('thread-msgs');
    if(!el)return;
    if(!msgStore.length){el.innerHTML='<div style="text-align:center;color:var(--muted);font-size:13px;padding:1rem">Commencez la conversation !</div>';return;}
    el.innerHTML=msgStore.map(m=>{
      const isMe=String(m.from_user)===String(currentUser?.id)||String(m.from_user)===String(currentUser?.email);
      const time=m.created_at?new Date(m.created_at).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'}):'';
      return '<div style="display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+'">'+'<div class="msg msg-'+(isMe?'me':'them')+'">'+esc(m.message)+'<div class="msg-time">'+time+(m._tmp?' · envoi...':'')+'</div></div></div>';
    }).join('');
    el.scrollTop=el.scrollHeight;
  }
  function addMsg(m){
    if(!m||m.id==null||msgIds.has(m.id))return false;
    if(!m._tmp){const i=msgStore.findIndex(x=>x._tmp&&x.message===m.message&&String(x.from_user)===String(m.from_user));if(i>-1){msgIds.delete(msgStore[i].id);msgStore.splice(i,1);}}
    msgIds.add(m.id);msgStore.push(m);msgStore.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));return true;
  }
  window.loadThreadMsgs=async function(convId){
    if(storeConvId!==convId){storeConvId=convId;msgStore=[];msgIds=new Set();}
    let data=null,error=null;
    try{const res=await sb.from('messages').select('*').eq('conversation_id',convId).order('created_at',{ascending:true});data=res.data;error=res.error;}catch(e){error=e;}
    if(error){if(!msgStore.length){const el=document.getElementById('thread-msgs');if(el)el.innerHTML='<div style="text-align:center;color:var(--muted);font-size:13px;padding:1rem">Connexion instable - reessayez.</div>';}return;}
    (data||[]).forEach(addMsg);renderStore();
    if(currentUser){try{await sb.from('messages').update({lu:true}).eq('conversation_id',convId).in('to_user',[currentUser.id,currentUser.email]);}catch(e){}refreshUnreadBadge();}
  };
  window.subscribeToConv=function(convId){
    if(typeof realtimeSub!=='undefined'&&realtimeSub){try{realtimeSub.unsubscribe();}catch(e){}}
    realtimeSub=sb.channel('conv-'+convId.replace(/[^a-zA-Z0-9_-]/g,'_')+'-'+Date.now()).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
      const m=payload.new;
      if(!m||m.conversation_id!==storeConvId)return;
      if(addMsg(m))renderStore();
    }).subscribe();
  };
  window.sendThreadMsg=async function(convId,toUser,pitName){
    if(!currentUser){if(typeof toast==='function')toast('Connectez-vous pour envoyer un message','error','!');return;}
    const inp=document.getElementById('thread-input');
    const txt=(inp?inp.value:'').trim();if(!txt)return;if(inp)inp.value='';
    const tempId='tmp_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    addMsg({id:tempId,conversation_id:convId,from_user:currentUser.id,to_user:toUser,message:txt,pitmaster_name:pitName,lu:false,created_at:new Date().toISOString(),_tmp:true});
    renderStore();
    let error=null;
    try{const res=await sb.from('messages').insert({conversation_id:convId,from_user:currentUser.id,to_user:toUser,message:txt,pitmaster_name:pitName,lu:false});error=res.error;}catch(e){error=e;}
    if(error){msgStore=msgStore.filter(m=>m.id!==tempId);msgIds.delete(tempId);renderStore();if(inp)inp.value=txt;if(typeof toast==='function')toast('Message non envoye - reessayez','error','!');}
  };
  window.sendThreadMsg._v3=true;
  async function refreshUnreadBadge(){
    const badge=document.getElementById('msg-notif');if(!badge)return;
    if(!currentUser){badge.classList.add('hidden');return;}
    try{const{count}=await sb.from('messages').select('id',{count:'exact',head:true}).eq('lu',false).in('to_user',[currentUser.id,currentUser.email]);
    if(count>0){badge.textContent=count>9?'9+':count;badge.classList.remove('hidden');}else badge.classList.add('hidden');}catch(e){}
  }
  window.refreshUnreadBadge=refreshUnreadBadge;
  window.renderThreadMsgs=function(msgs){(msgs||[]).forEach(addMsg);renderStore();};
  window.renderThreadMsgs._v3=true;
  function subscribeGlobal(){
    if(globalSub){try{globalSub.unsubscribe();}catch(e){}globalSub=null;}
    if(!currentUser)return;
    globalSub=sb.channel('inbox-'+String(currentUser.id).slice(0,8)+'-'+Date.now()).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
      const m=payload.new;if(!m||!currentUser)return;
      const forMe=String(m.to_user)===String(currentUser.id)||String(m.to_user)===String(currentUser.email);
      if(!forMe)return;refreshUnreadBadge();
      if(m.conversation_id!==storeConvId&&typeof toast==='function')toast('Nouveau message de '+esc(m.pitmaster_name||'un membre'),'success','!');
    }).subscribe();
  }
  function init(){
    if(typeof sb!=='undefined'){
      sb.auth.onAuthStateChange(()=>{setTimeout(()=>{refreshUnreadBadge();subscribeGlobal();},600);});
      setTimeout(()=>{refreshUnreadBadge();subscribeGlobal();},1500);
      setInterval(refreshUnreadBadge,45000);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();