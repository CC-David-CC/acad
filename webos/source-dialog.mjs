// Signed bytes are displayed as inert names; source HTML is never executed.
const NAME=/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
export async function openCadSources({read,valid,signal,onClose=()=>{}}){
 if(typeof read!=='function'||!valid()||signal?.aborted)throw Error('Source access unavailable.');
 const controller=new AbortController(),urls=new Map();let dialog=null,closed=false,busy=false;
 const done=()=>{
  if(closed)return;closed=true;controller.abort();signal?.removeEventListener('abort',done);
  for(const [url,timer] of urls){clearTimeout(timer);URL.revokeObjectURL(url)}urls.clear();
  if(dialog?.open)dialog.close();dialog?.remove();onClose();
 };
 signal?.addEventListener('abort',done,{once:true});
 try{
  const index=await read('SOURCE-INDEX.html',{signal:controller.signal});
  if(closed||!valid()||controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
  if(!(index instanceof Blob)||index.size>131072)throw Error('Invalid source index.');
  const parsed=new DOMParser().parseFromString(await index.text(),'text/html');
  if(closed||!valid()||controller.signal.aborted)throw new DOMException('Cancelled','AbortError');
  const anchors=[...parsed.querySelectorAll('a[href]')];
  if(!anchors.length||anchors.length>64||anchors.some(a=>!NAME.test(a.getAttribute('href'))||!a.textContent.trim()))throw Error('Invalid source index.');
  dialog=document.createElement('dialog');dialog.className='codi-confirm-dialog codi-cad-sources-dialog';const heading=document.createElement('h2'),list=document.createElement('ul'),status=document.createElement('p'),close=document.createElement('button');
  heading.textContent='Sources and licenses';status.setAttribute('role','status');close.textContent='Close';close.type='button';dialog.append(heading,list,status,close);close.addEventListener('click',done);dialog.addEventListener('cancel',e=>{e.preventDefault();done()});
  for(const anchor of anchors){
   const item=document.createElement('li'),button=document.createElement('button'),name=anchor.getAttribute('href');button.type='button';button.textContent=anchor.textContent.trim();
   button.addEventListener('click',async()=>{
    if(busy||closed||!valid()||controller.signal.aborted)return;busy=true;button.disabled=true;status.textContent='Preparing download…';
    try{
     const blob=await read(name,{signal:controller.signal});if(closed||!valid()||controller.signal.aborted)throw new DOMException('Cancelled','AbortError');if(!(blob instanceof Blob))throw Error('Invalid source data.');
     const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.hidden=true;dialog.append(link);link.click();link.remove();const timer=setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url)},60000);urls.set(url,timer);status.textContent='Download started.';
    }catch(error){if(!closed&&valid())status.textContent=error?.name==='AbortError'?'Download cancelled.':'Source download unavailable.';}
    finally{busy=false;button.disabled=false;}
   });item.append(button);list.append(item);
  }
  document.body.append(dialog);if(controller.signal.aborted||!valid())throw new DOMException('Cancelled','AbortError');dialog.showModal();return done;
 }catch(error){done();throw error;}
}
