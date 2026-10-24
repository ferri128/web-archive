(()=>{
 let openRecord,scroll=0;
 const baseTitle=document.title;
 const reader=()=>document.querySelector('#reader'),main=()=>document.querySelector('#main');
 const isOpen=()=>!reader().hidden;
 function hide(){reader().hidden=true;main().hidden=false;document.title=baseTitle;window.scrollTo({top:scroll,behavior:'instant'});}
 function close(){hide();if(location.hash.startsWith('#record/'))history.replaceState(null,'',location.pathname+location.search);}
 function open(id){
  if(!isOpen())scroll=window.scrollY;
  main().hidden=true;reader().hidden=false;
  const hash='#record/'+encodeURIComponent(id);
  if(location.hash!==hash)history.pushState(null,'',hash);
  const heading=reader().querySelector('.reader-title');
  document.title=(heading?.textContent?heading.textContent+' | ':'')+baseTitle;
  if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  window.scrollTo({top:0,behavior:'instant'});
 }
 function route(){
  if(location.hash.startsWith('#record/')){
   let id;try{id=decodeURIComponent(location.hash.slice(8));}catch{close();return;}
   openRecord(id);
  }else if(isOpen())hide();
 }
 function start(callback){openRecord=callback;route();window.addEventListener('hashchange',route);
  document.addEventListener('click',event=>{if(isOpen()&&event.target.closest('.nav,.exam-buttons button,#clearFilter,.brand'))close();});
 }
 globalThis.ArchiveReader={open,close,isOpen,start};
})();
