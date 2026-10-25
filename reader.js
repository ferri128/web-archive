const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state=globalThis.PUBLIC_ARCHIVE;
const names={mid:'중간고사',final:'기말고사',note:'개념 노트',problem:'문제 풀이'};
let filter=null,view='all';
const subject=id=>state.subjects.find(s=>s.id===id)?.name||'과목 없음';
const markdown=value=>ArchiveContent.markdown(value);
const date=value=>new Date(value).toLocaleDateString('ko-KR');
function inTerm(s,year,semester){if(s.year&&s.semester)return s.year===year&&s.semester===semester;const entries=state.entries.filter(e=>e.subject===s.id);return entries.length?entries.some(e=>e.year===year&&e.semester===semester):year===1&&semester===1;}
function renderTree(){
 const opened=new Set($$('#tree details[open]').map(d=>d.dataset.key));
 $('#tree').innerHTML=[1,2,3,4,5,6].map(year=>`<details data-key="y${year}" ${opened.has('y'+year)||filter?.year===year||(!opened.size&&year===1)?'open':''}><summary>${year}학년</summary>${[1,2].map(semester=>`<details class="semester" data-key="y${year}s${semester}" ${opened.has(`y${year}s${semester}`)||filter?.year===year&&filter?.semester===semester?'open':''}><summary>${semester}학기</summary>${state.subjects.filter(s=>inTerm(s,year,semester)).map(s=>`<details class="subject-branch" data-key="y${year}s${semester}p${esc(s.id)}" ${opened.has(`y${year}s${semester}p${s.id}`)||filter?.subject===s.id&&filter?.year===year&&filter?.semester===semester?'open':''}><summary>${esc(s.name)}</summary><div class="exam-buttons">${['mid','final'].map(exam=>`<button data-year="${year}" data-semester="${semester}" data-subject="${esc(s.id)}" data-exam="${exam}" class="${filter?.year===year&&filter?.semester===semester&&filter?.subject===s.id&&filter?.exam===exam?'active':''}">${names[exam]}</button>`).join('')}</div></details>`).join('')}</details>`).join('')}</details>`).join('');
 $$('.exam-buttons button').forEach(b=>b.onclick=()=>{filter={year:+b.dataset.year,semester:+b.dataset.semester,subject:b.dataset.subject,exam:b.dataset.exam};view='all';render();$('#sidebar').classList.remove('open');});
}
function render(){
 $('#total').textContent=state.entries.length;
 $$('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view&&!filter));
 renderTree();
 const query=$('#search').value.trim().toLocaleLowerCase(),type=$('#typeFilter').value;
 const entries=state.entries.filter(e=>(!filter||Object.entries(filter).every(([key,value])=>e[key]===value))&&(view!=='star'||e.starred)&&(!type||(type==='bundle'?!!e.questions:e.type===type&&!e.questions))&&(!query||[e.title,e.examYear||'',e.body,e.solution,e.tags,subject(e.subject),...(e.questions||[]).flatMap(q=>[q.body,q.solution])].join(' ').toLocaleLowerCase().includes(query)));
 entries.sort((a,b)=>$('#sort').value==='title'?a.title.localeCompare(b.title,'ko'):$('#sort').value==='old'?String(a.updated).localeCompare(String(b.updated)):String(b.updated).localeCompare(String(a.updated)));
 const title=filter?subject(filter.subject)+' · '+names[filter.exam]:view==='star'?'책갈피':'모든 기록';
 $('#listTitle').innerHTML=esc(title)+` <span>${entries.length}</span>`;$('#crumb').textContent=filter?`${filter.year}학년 / ${filter.semester}학기 / ${title}`:title;
 $('#activeFilter').innerHTML=filter?'<button id="clearFilter">'+filter.year+'학년 · '+filter.semester+'학기 · '+esc(subject(filter.subject))+' · '+names[filter.exam]+'　×</button>':'';
 if($('#clearFilter'))$('#clearFilter').onclick=()=>{filter=null;render();};
 $('#entries').innerHTML=entries.length?entries.map(e=>`<article class="card" role="button" tabindex="0" data-id="${esc(e.id)}" aria-label="${esc(e.title)} 읽기"><div class="card-top"><span class="pill ${e.type}">${e.questions?'연도별 기출':names[e.type]}</span>${e.starred?'<span class="star on" aria-label="책갈피">★</span>':''}</div><h3>${e.questions?`<span class="exam-year-label">${e.examYear}년</span>`:''}${esc(e.questions&&e.title.startsWith(e.examYear+'년 ')?e.title.slice(String(e.examYear).length+2):e.title)}</h3><div class="card-path">${e.year}학년 · ${e.semester}학기 · ${esc(subject(e.subject))} · ${names[e.exam]}</div><p>${esc(e.body||e.solution||'')}</p><div class="tags">${e.questions?`<span class="tag">문제 ${e.questions.length}개</span>`:''}${e.tags.split(',').map(t=>t.trim()).filter(Boolean).slice(0,4).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}</div><div class="card-bottom">${date(e.updated)}</div></article>`).join(''):'<div class="empty"><h3>표시할 기록이 없습니다.</h3><p>검색어나 과목을 바꾸어 확인해보세요.</p></div>';
 $$('.card').forEach(card=>{card.onclick=()=>openReader(card.dataset.id);card.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openReader(card.dataset.id);}};});
}
function openReader(id){
 const entry=state.entries.find(e=>e.id===id);if(!entry)return;
 const questions=entry.questions||[{body:entry.body,solution:entry.solution,images:entry.images,imageWidths:entry.imageWidths}];
 $('#readerContent').innerHTML=`<div class="dialog-head"><div class="reader-meta"><span class="pill">${entry.questions?entry.examYear+'년 기출':names[entry.type]}</span>${entry.questions?`<span>문제 ${questions.length}개</span>`:''}</div><button class="reader-back" id="closeReader">← 목록으로</button></div><h2 class="reader-title">${esc(entry.title)}</h2><div class="reader-path">${entry.year}학년 / ${entry.semester}학기 / ${esc(subject(entry.subject))} / ${names[entry.exam]}</div>${entry.questions?`<nav class="question-tabs" aria-label="문제 번호 바로가기">${questions.map((_,i)=>`<button data-jump="${i}">${i+1}번</button>`).join('')}</nav><div class="solution-controls"><button class="secondary" id="expandSolutions">풀이 전체 펼치기</button><button class="secondary" id="collapseSolutions">풀이 전체 접기</button></div>`:''}${questions.map((q,i)=>`<section class="bundle-question" id="question${i}"><h3>${entry.questions?i+1+'번 문제':'문제 · 개념'}</h3><div class="prose">${markdown(q.body)}</div><div class="reader-images">${ArchiveImages.gallery(q.images,q.imageWidths)}</div><details class="question-solution" open><summary>${entry.questions?'풀이 · 정답':'나의 풀이 · 생각'}</summary><div class="prose">${markdown(q.solution||'아직 풀이가 없습니다.')}</div></details></section>`).join('')}`;
 $('#closeReader').onclick=()=>ArchiveReader.close();
 if($('#expandSolutions'))$('#expandSolutions').onclick=()=>$$('.question-solution').forEach(d=>d.open=true);
 if($('#collapseSolutions'))$('#collapseSolutions').onclick=()=>$$('.question-solution').forEach(d=>d.open=false);
 $$('[data-jump]').forEach(b=>b.onclick=()=>$('#question'+b.dataset.jump).scrollIntoView({behavior:'smooth',block:'start'}));
 ArchiveReader.open(entry.id);
}
$$('.nav').forEach(b=>b.onclick=()=>{filter=null;view=b.dataset.view;render();$('#sidebar').classList.remove('open');});
$('#search').oninput=$('#typeFilter').onchange=$('#sort').onchange=render;
$('#gridBtn').onclick=()=>{$('#entries').classList.remove('list');$('#gridBtn').classList.add('selected');$('#listBtn').classList.remove('selected');};
$('#listBtn').onclick=()=>{$('#entries').classList.add('list');$('#listBtn').classList.add('selected');$('#gridBtn').classList.remove('selected');};
$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');
document.addEventListener('click',e=>{if(innerWidth<=720&&!e.target.closest('#sidebar,#mobileMenu'))$('#sidebar').classList.remove('open');});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.target.matches('input,textarea,select')&&!ArchiveReader.isOpen()){e.preventDefault();$('#search').focus();}});
render();
ArchiveReader.start(openReader);
