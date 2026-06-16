(function(){
  'use strict';
  let msgStore=[],msgIds=new Set(),storeConvId=null,globalSub=null,localRealtimeSub=null;
  const esc=s=>(window.escHTML||(x=>String(x??'')))(s);

  function cu(){ return window.currentUser||null; }

  function renderStore(){
    const el=document.getElementById('thread-msgs');
    if(!el)return;
    if(!msgStore.length){
      el.innerHTML='<div style="text-align:center;color:var(--muted);font-size:13px;padding:1rem">Commencez la conversation !</div>';
      return;
    }
    el.innerHTML=msgStore.map(m=>{
      const me=cu();
      const isMe=me&&(String(m.from_user)===String(me.id)||String(m.from_user)===String(me.email));
      const time=m.created_at?new Date(m.created_at).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'}):'';
      return '<div style="display:flex;flex-direction:column;align-items:'+(isMe?'flex-end':'flex-start')+'">'
        +'<div class="msg msg-'+(isMe?'me':'them')+'">'+esc(m.message)
        +'<div class="msg-time">'+time+(m._tmp?' · envoi…':'')+'</div></div></div>';
    }).join('');
    el.scrollTop=el.scrollHeight;
  }

  function addMsg(m){
    if(!m||m.id==null)return false;
    if(msgIds.has(m.id))return false;
    if(!m._tmp){
      const i=msgStore.findIndex(x=>x._tmp&&x.message===m.message&&String(x.from_user)===String(m.from_user));
      if(i>-1){msgIds.delete(msgStore[i].id);msgStore.splice(i,1);}
    }
    msgIds.add(m.id);
    msgStore.push(m);
    msgStore.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    return true;
  }

  window.loadThreadMsgs=async function(convId){
    if(storeConvId!==convId){storeConvId=convId;msgStore=[];msgIds=new Set();}
    let data=null,error=null;
    try{
      const res=await sb.from('messages').select('*').eq('conversation_id',convId).order('created_at',{ascending:true});
      data=res.data;error=res.error;
    }catch(e){error=e;}
    if(error){
      if(!msgStore.length){
        const el=document.getElementById('thread-msgs');
        if(el)el.innerHTML='<div style="text-align:center;color:var(--muted);font-size:13px;padding:1rem">Connexion instable — réessayez.</div>';
      }
      return;
    }
    (data||[]).forEach(addMsg);
    renderStore();
    const me=cu();
    if(me){
      try{
        await sb.from('messages').update({lu:true})
          .eq('conversation_id',convId)
          .in('to_user',[me.id,me.email]);
      }catch(e){}
      refreshUnreadBadge();
    }
  };

  window.subscribeToConv=function(convId){
    if(localRealtimeSub){try{localRealtimeSub.unsubscribe();}catch(e){}localRealtimeSub=null;}
    const safeId=convId.replace(/[^a-zA-Z0-9_-]/g,'_');
    localRealtimeSub=sb.channel('conv-v5-'+safeId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'conversation_id=eq.'+convId},payload=>{
        const m=payload.new;
        if(!m||m.conversation_id!==storeConvId)return;
        if(addMsg(m)){
          renderStore();
          const me=cu();
          if(me&&(String(m.to_user)===String(me.id)||String(m.to_user)===String(me.email))){
            sb.from('messages').update({lu:true}).eq('id',m.id).catch(()=>{});
            refreshUnreadBadge();
          }
        }
      }).subscribe();
  };

  window.sendThreadMsg=async function(convId,toUser,pitName){
    const me=cu();
    if(!me){if(typeof toast==='function')toast('Connectez-vous pour envoyer un message','error','⚠️');return;}
    const inp=document.getElementById('thread-input');
    const txt=(inp?inp.value:'').trim();
    if(!txt)return;
    if(inp)inp.value='';
    const tempId='tmp_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const tempMsg={id:tempId,conversation_id:convId,from_user:me.id,to_user:toUser,
      message:txt,pitmaster_name:pitName,lu:false,created_at:new Date().toISOString(),_tmp:true};
    addMsg(tempMsg);
    renderStore();
    let error=null;
    try{
      const res=await sb.from('messages').insert({
        conversation_id:convId,from_user:me.id,to_user:toUser,
        message:txt,pitmaster_name:pitName,lu:false
      });
      error=res.error;
    }catch(e){error=e;}
    if(error){
      msgStore=msgStore.filter(m=>m.id!==tempId);
      msgIds.delete(tempId);
      renderStore();
      if(inp)inp.value=txt;
      if(typeof toast==='function')toast('Message non envoyé — réessayez','error','⚠️');
    }
  };
  window.sendThreadMsg._v3=true;

  window.renderThreadMsgs=function(msgs){(msgs||[]).forEach(addMsg);renderStore();};
  window.renderThreadMsgs._v3=true;

  async function refreshUnreadBadge(){
    const badge=document.getElementById('msg-notif');
    if(!badge)return;
    const me=cu();
    if(!me){badge.classList.add('hidden');return;}
    try{
      const{count}=await sb.from('messages')
        .select('id',{count:'exact',head:true})
        .eq('lu',false)
        .in('to_user',[me.id,me.email]);
      if(count>0){badge.textContent=count>9?'9+':count;badge.classList.remove('hidden');}
      else badge.classList.add('hidden');
    }catch(e){}
  }
  window.refreshUnreadBadge=refreshUnreadBadge;

  function subscribeGlobal(){
    if(globalSub){try{globalSub.unsubscribe();}catch(e){}globalSub=null;}
    const me=cu();
    if(!me)return;
    const uid=String(me.id).replace(/[^a-zA-Z0-9]/g,'').slice(0,12);
    globalSub=sb.channel('inbox-v5-'+uid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
        const m=payload.new;
        const me2=cu();
        if(!m||!me2)return;
        const forMe=String(m.to_user)===String(me2.id)||String(m.to_user)===String(me2.email);
        if(!forMe)return;
        refreshUnreadBadge();
        if(m.conversation_id!==storeConvId&&typeof toast==='function')
          toast('Nouveau message de '+esc(m.pitmaster_name||'un membre'),'success','💬');
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
