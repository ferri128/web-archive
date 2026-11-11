/* Markdown and math share one renderer for preview and saved records. */
(()=>{
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const keywords={
 cpp:new Set('alignas alignof asm auto break case catch class concept const consteval constexpr constinit const_cast continue co_await co_return co_yield decltype default delete do dynamic_cast else enum explicit export extern for friend goto if inline mutable namespace new noexcept operator private protected public register reinterpret_cast requires return sizeof static static_assert static_cast struct switch template this thread_local throw try typedef typeid typename union using virtual volatile while'.split(' ')),
 python:new Set('and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try while with yield'.split(' '))
};
const types=new Set('bool char char8_t char16_t char32_t double float int long short signed unsigned void wchar_t string vector size_t std'.split(' '));
const builtins=new Set('print input len range enumerate zip map filter list dict set tuple str int float bool sum min max abs round sorted open super isinstance type self True False None true false nullptr'.split(' '));
function highlight(source,language){
 const lang=language==='c'?'cpp':language;
 if(!keywords[lang])return escape(source);
 const pattern=lang==='python'
  ? /#[^\n]*|(?:[rRuUbBfF]{0,2})(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\[\s\S]|[^"\\\n])*(?:"|(?=\n)|$)|'(?:\\[\s\S]|[^'\\\n])*(?:'|(?=\n)|$))|\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?[\d_]+)?j?)\b|\b[A-Za-z_]\w*\b/g
  : /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|^[ \t]*#[^\n]*|R"([^\s()\\]{0,16})\([\s\S]*?\)\1"|"(?:\\[\s\S]|[^"\\\n])*(?:"|(?=\n)|$)|'(?:\\[\s\S]|[^'\\\n])*(?:'|(?=\n)|$)|\b(?:0[xX][\da-fA-F]+|0[bB][01]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)[uUlLfF]*\b|\b[A-Za-z_]\w*\b/gm;
 let result='',last=0;
 for(const match of source.matchAll(pattern)){
  const token=match[0];let kind='';
  if(token.startsWith('//')||token.startsWith('/*')||lang==='python'&&token.startsWith('#'))kind='comment';
  else if(lang==='cpp'&&/^\s*#/.test(token))kind='directive';
  else if(/^(?:[rRuUbBfF]{0,2})?["']/.test(token)||token.startsWith('R"'))kind='string';
  else if(/^\d/.test(token))kind='number';
  else if(keywords[lang].has(token))kind='keyword';
  else if(lang==='cpp'&&types.has(token))kind='type';
  else if(builtins.has(token))kind='builtin';
  else if(/^\s*\(/.test(source.slice(match.index+token.length)))kind='function';
  result+=escape(source.slice(last,match.index))+(kind?'<span class="syntax-'+kind+'">'+escape(token)+'</span>':escape(token));last=match.index+token.length;
 }
 return result+escape(source.slice(last));
}
function markdown(value){
 const tokens=[];
 const text=String(value).replace(/(?<fence>`{3,})[^\n]*\n[\s\S]*?(?:\k<fence>(?!`)|$)|`[^`\n]+`|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)[^$\n]+?\$/g,raw=>{
  let html;
  if(raw.startsWith('```'))html='<pre><code>'+highlight(raw.slice(raw.indexOf('\n')+1).replace(new RegExp(raw.match(/^`+/)[0]+'$'),''),raw.slice(raw.match(/^`+/)[0].length,raw.indexOf('\n')).trim().toLowerCase())+'</code></pre>';
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
globalThis.ArchiveContent={markdown,highlight};
})();
