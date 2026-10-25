(()=>{
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pattern=/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,([A-Za-z0-9+/]+={0,2})$/;
 function validData(value){
  if(typeof value!=='string')return false;const match=value.match(pattern);if(!match)return false;
  const bytes=Math.floor(match[2].length*3/4)-(match[2].endsWith('==')?2:match[2].endsWith('=')?1:0);if(bytes>2*1024*1024)return false;
  if(match[1]!=='svg+xml')return true;
  try{
   const text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0)));
   if(!/<svg(?:\s|>)/i.test(text)||!/<\/svg\s*>/i.test(text))return false;
   if(/<!DOCTYPE|<!ENTITY|<\?(?!xml(?:\s|\?>))|<\s*(?:script|foreignObject|iframe|object|embed|audio|video)\b|\bon[\w:-]+\s*=|@import|(?:javascript|vbscript)\s*:/i.test(text))return false;
   for(const match of text.matchAll(/\b(?:href|src)\s*=\s*(["'])([\s\S]*?)\1/gi))if(!match[2].trim().startsWith('#'))return false;
   if(/\b(?:href|src)\s*=\s*[^\s"']/i.test(text))return false;
   for(const match of text.matchAll(/url\s*\(\s*(["']?)(.*?)\1\s*\)/gi))if(!match[2].trim().startsWith('#'))return false;
   return true;
  }catch{return false;}
 }
 function validSet(images,widths){return Array.isArray(images)&&images.length<=12&&images.every(validData)&&(widths===undefined||(Array.isArray(widths)&&widths.length===images.length&&widths.every(w=>Number.isInteger(w)&&w>=20&&w<=100)));}
 function width(widths,index){const value=widths?.[index];return Number.isInteger(value)&&value>=20&&value<=100?value:100;}
 function gallery(images,widths,label='문제 이미지'){
  return images.map((src,index)=>`<figure class="attached-figure" style="width:${width(widths,index)}%"><img src="${escape(src)}" alt="${escape(label)} ${index+1}" loading="lazy"></figure>`).join('');
 }
 globalThis.ArchiveImages={validData,validSet,width,gallery};
})();
