(()=>{
 const modes={questions:'문제만',paired:'문제 + 풀이',separate:'문제지·해설지 분리'};
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let current=null,mode='questions',printing=false,preparedFor=null;
 function build(entry,subject,selected){
  if(!modes[selected])throw Error('인쇄 방식을 선택해주세요.');
  const questions=entry.questions||[{body:entry.body,solution:entry.solution,images:entry.images,imageWidths:entry.imageWidths}];
  const heading=label=>`<header class="print-heading"><p>Jo Woo Seong Study · ${escape(label)}</p><h1>${escape(entry.title)}</h1><div>${entry.year}학년 ${entry.semester}학기 · ${escape(subject)} · ${entry.exam==='mid'?'중간고사':'기말고사'}${entry.examYear?' · '+entry.examYear+'년':''} · ${questions.length}문제</div></header>`;
  const solution=q=>ArchiveContent.markdown(q.solution||'풀이 미작성');
  const sheet=heading(selected==='paired'?'문제 및 풀이':'문제지')+questions.map((q,i)=>`<section class="print-question"><div class="print-prompt"><h2>${i+1}번 문제</h2><div class="prose">${ArchiveContent.markdown(q.body)}</div><div class="reader-images">${ArchiveImages.gallery(q.images,q.imageWidths)}</div></div>${selected==='paired'?`<section class="print-solution"><h3>풀이 · 정답</h3><div class="prose">${solution(q)}</div></section>`:''}</section>`).join('');
  const answers=selected==='separate'?`<section class="print-answer-sheet">${heading('해설지')}${questions.map((q,i)=>`<section class="print-question"><h2>${i+1}번 풀이 · 정답</h2><div class="prose">${solution(q)}</div></section>`).join('')}</section>`:'';
  return (sheet+answers).replace(/ loading="lazy"/g,'');
 }
 function root(){let node=document.querySelector('#printDocument');if(!node){node=document.createElement('section');node.id='printDocument';document.body.append(node);}return node;}
 function fitMath(){const node=root();node.classList.add('print-measuring');for(const display of node.querySelectorAll('.katex-display')){const formula=display.querySelector('.katex');if(!formula)continue;formula.style.fontSize='1em';const math=formula.querySelector('.katex-html'),available=display.clientWidth,width=math?.getBoundingClientRect().width||0;if(width>available&&available>0)formula.style.fontSize=(available/width*.98)+'em';}node.classList.remove('print-measuring');}
 function prepare(){if(!current||!ArchiveReader.isOpen())return;if(preparedFor?.entry!==current.entry||preparedFor?.mode!==mode){root().innerHTML=build(current.entry,current.subject,mode);preparedFor={entry:current.entry,mode};}document.body.classList.add('printing-archive');fitMath();}
 function cleanup(){document.body.classList.remove('printing-archive');const node=document.querySelector('#printDocument');if(node)node.innerHTML='';preparedFor=null;printing=false;const button=document.querySelector('#printArchive');if(button)button.disabled=false;}
 async function print(){
  if(printing||!current)return;printing=true;
  const button=document.querySelector('#printArchive'),feedback=document.querySelector('#printFeedback');button.disabled=true;feedback.textContent='인쇄용 수식과 이미지를 준비하고 있습니다…';
  try{
   prepare();await document.fonts.ready;
   await Promise.all([...root().querySelectorAll('img')].map(image=>image.decode()));
   fitMath();feedback.textContent='';button.disabled=false;printing=false;window.print();
  }catch(error){cleanup();feedback.textContent='인쇄 준비 중 오류가 발생했습니다. 이미지가 정상적으로 표시되는지 확인하고 다시 시도해주세요.';}
  finally{button.disabled=false;printing=false;}
 }
 function mount(entry,subject){
  current={entry,subject};preparedFor=null;mode='questions';const existing=document.querySelector('#printControls');if(existing)existing.remove();
  const controls=document.createElement('section');controls.id='printControls';controls.className='print-controls';
  controls.innerHTML=`<div class="print-control-row"><label for="printMode">인쇄 방식</label><select id="printMode">${Object.entries(modes).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select><button type="button" id="printArchive" class="secondary">인쇄 / PDF 저장</button></div><p>선택한 시험 전체를 A4로 출력합니다. PDF 저장도 가능합니다. 하단 주소·날짜는 인쇄창의 ‘머리글 및 바닥글’을 끄면 사라집니다.</p><p id="printFeedback" role="status"></p>`;
  document.querySelector('#readerContent .reader-path').insertAdjacentElement('afterend',controls);
  document.querySelector('#printMode').onchange=event=>mode=event.target.value;
  document.querySelector('#printArchive').onclick=print;
 }
 if(typeof window!=='undefined'){window.addEventListener('beforeprint',prepare);window.addEventListener('afterprint',cleanup);}
 globalThis.ArchivePrint={build,mount};
})();
