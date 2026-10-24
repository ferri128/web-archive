/* Markdown and math share one renderer for preview and saved records. */
(()=>{
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markdown(value){
 const tokens=[];
 const text=String(value).replace(/```[^\n]*\n[\s\S]*?(?:```|$)|`[^`\n]+`|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)[^$\n]+?\$/g,raw=>{
  let html;
  if(raw.startsWith('```'))html='<pre><code>'+escape(raw.replace(/^```[^\n]*\n/,'').replace(/```$/,''))+'</code></pre>';
  else if(raw.startsWith('`'))html='<code>'+escape(raw.slice(1,-1))+'</code>';
  else {
   const display=raw.startsWith('$$')||raw.startsWith('\\['),width=raw.startsWith('$')&&!display?1:2;
   const source=raw.slice(width,-width);
   try{html=globalThis.katex.renderToString(source,{displayMode:display,throwOnError:true,trust:false,strict:'ignore',maxExpand:1000});}
   catch(error){html='<span class="math-error" title="'+escape(error.message)+'">'+escape(raw)+'</span>';}
  }
  const token='\uE000'+tokens.length+'\uE001';tokens.push(html);return token;
 });
 const html=text.split('\n').map(line=>{
  let body=escape(line).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  if(line.startsWith('## '))return '<h4>'+body.slice(3)+'</h4>';
  if(line.startsWith('# '))return '<h3>'+body.slice(2)+'</h3>';
  if(line.startsWith('- '))return '<p class="bullet">• '+body.slice(2)+'</p>';
  if(/^\uE000\d+\uE001$/.test(line))return body;
  return '<p>'+(body||'<br>')+'</p>';
 }).join('');
 return html.replace(/\uE000(\d+)\uE001/g,(_,index)=>tokens[+index]??'');
}
globalThis.ArchiveContent={markdown};
})();
