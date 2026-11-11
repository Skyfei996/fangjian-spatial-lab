import './style.css';
import { BlockScene, type Tool } from './scene';
import { COLORS, PRESETS, clone, project, projected, equal, checkAddition, validScene, type Cube, type View } from './geometry';

const icons: Record<string,string> = {
 cube:'<path d="m12 3 9 5v8l-9 5-9-5V8z"/><path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',
 orbit:'<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-35 12 12)"/>',
 remove:'<path d="m3 15 9-11a2 2 0 0 1 3 0l6 5a2 2 0 0 1 0 3l-8 9H8zM7 11l9 8M13 21h8"/>',
 paint:'<path d="m14 3 7 7-10 10H4v-7zM11 6l7 7M3 21h7"/>',
 undo:'<path d="M4 10h9a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5" transform="translate(0 -2)"/>',
 redo:'<path d="M20 8h-9a6 6 0 0 0 0 12M20 8l-5-5M20 8l-5 5"/>',
 save:'<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 chevrondown:'<path d="m6 9 6 6 6-6"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 bulb:'<path d="M9 18h6M9 21h6M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
 book:'<path d="M12 6c-3-3-7-3-10-2v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 2ZM12 6v15"/>',
 hand:'<path d="M8 12V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v10c0 4-3 7-7 7-4 0-5-3-7-6l-3-4a2 2 0 0 1 3-2l2 2Z"/>',
 layers:'<path d="m12 3 10 6-10 6L2 9Zm-9 11 9 5 9-5M3 18l9 5 9-5"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01"/>',
 grid:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
 spark:'<path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 full:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
 front:'<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M5 10h14M12 4v16"/>',
 top:'<path d="m12 4 10 8-10 8L2 12Z"/><path d="m7 8 10 8M7 16l10-8"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
 folder:'<path d="M3 7V4h7l2 3h9v13H3z"/>',
 tools:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>'
};
const icon=(name:string,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.cube}</svg>`;
const iso=(color:string,variant=0)=>`<svg viewBox="0 0 90 72" aria-hidden="true" class="mini-model"><g stroke="${color}" stroke-width="1.3" stroke-linejoin="round">${(variant===1?[[25,26],[46,38],[25,3],[4,38]]:variant===2?[[7,38],[7,16],[49,38],[49,16],[28,16]]:[[6,38],[27,50],[48,38],[27,26],[48,16]]).map(([x,y])=>`<g transform="translate(${x} ${y})"><path d="m0 7 12-7 12 7-12 7Z" fill="${color}" fill-opacity=".38"/><path d="m0 7 12 7v14L0 21Z" fill="${color}" fill-opacity=".65"/><path d="m12 14 12-7v14l-12 7Z" fill="${color}" fill-opacity=".85"/></g>`).join('')}</g></svg>`;

type Mode='build'|'practice'|'explain';
let mode:Mode='build';
let cubes=clone(PRESETS[0].cubes);
let tool:Tool='orbit';
let color=COLORS[0];
let history:Cube[][]=[];let future:Cube[][]=[];
let task='draw';let selectedCells=new Set<string>();let feedback:{correct:boolean;reason:string}|null=null;
let revealed=false;let highlightCell:string|null=null;let highlightView:View='front';let selectedPreset=0;
let savedBuild:Cube[]|null=null;let exerciseBase=clone(PRESETS[1].cubes);let explainStep=0;
let dirty=false;let toastTimer:ReturnType<typeof setTimeout>;
try { const stored=localStorage.getItem('fangjian-scene-v1'); if(stored){const value=JSON.parse(stored);if(validScene(value)){cubes=value;selectedPreset=-1;}} } catch { /* Storage can be unavailable in private browsing. */ }

document.querySelector('#app')!.innerHTML=`
  <header class="app-header">
    <a class="brand" href="#" aria-label="方见，空间思维实验室"><span class="brand-mark">${icon('cube')}</span><span class="brand-name">方见<span class="brand-divider"></span><span class="brand-tag">空间思维实验室</span></span><span class="beta">BETA</span></a>
    <nav class="mode-switch" aria-label="工作模式">
      <button data-mode="build" class="active">${icon('cube')}<span>自由搭建</span></button><button data-mode="practice">${icon('book')}<span>动手做题</span></button><button data-mode="explain">${icon('bulb')}<span>一起讲解</span></button>
    </nav>
    <div class="header-actions"><button class="icon-btn help-btn" data-action="help" aria-label="使用帮助">${icon('help')}</button><button class="save-btn" data-action="save">${icon('save')}<span>保存作品</span></button></div>
  </header>
  <div class="workspace">
    <aside class="toolbox" id="toolbox">
      <div class="panel-heading"><div><span class="eyebrow">YOUR BUILDING KIT</span><h2>从一块积木开始</h2></div><button class="icon-btn mobile-close" data-action="tools" aria-label="收起工具">${icon('close')}</button></div>
      <div class="toolbox-body">
        <section class="kit-section"><div class="section-label">基础图形 <span>01</span></div><button class="shape-tile" data-tool="add"><span class="shape-visual">${iso('#8290e5',1)}</span><span><strong>正方体</strong><small>点一点，自由搭建</small></span><span class="shape-plus">${icon('plus')}</span></button></section>
        <section class="kit-section"><div class="section-label">积木颜色 <span id="color-name">鸢尾蓝</span></div><div class="color-list">${COLORS.map((c,i)=>`<button class="color-swatch ${i===0?'active':''}" style="--swatch:${c}" data-color="${c}" aria-label="选择${['鸢尾蓝','薄荷绿','杏子橙','蔷薇粉','晴空蓝'][i]}" aria-pressed="${i===0}">${icon('check')}</button>`).join('')}</div><p class="section-note">选好颜色，再添加或给积木换色。</p></section>
        <section class="kit-section examples"><div class="section-label">灵感搭建 <span>试一试</span></div><div class="preset-list">${PRESETS.map((p,i)=>`<button class="preset-card ${selectedPreset===i?'active':''}" data-preset="${i}"><span class="preset-picture preset-${i}">${iso(COLORS[i],i)}</span><span><strong>${p.name}</strong><small>${p.cubes.length} 块积木</small></span>${icon('chevron')}</button>`).join('')}</div></section>
        <div class="toolbox-note"><span class="note-icon">${icon('spark')}</span><strong>小小积木，大大想象</strong><p>没有唯一的搭法，<br>每一次尝试都有新发现。</p></div>
      </div>
      <div class="toolbox-footer"><button data-action="export">${icon('download')}导出</button><span></span><button data-action="import">${icon('upload')}导入</button><input type="file" accept=".json,application/json" id="import-file" hidden></div>
    </aside>
    <main class="main-area">
      <div class="workspace-heading"><div><div class="heading-kicker"><span class="live-dot"></span><span id="heading-kicker">想象力，正在搭建中</span></div><h1 id="main-title">换个角度，<span>看见不同。</span></h1><p id="main-description">搭出脑海里的形状，让空间变得触手可及。</p></div><span class="workspace-badge">${icon('cube')}<span id="scene-badge">3D 互动工作台</span></span></div>
      <div class="mobile-question" id="mobile-question"></div>
      <section class="scene-card" aria-label="三维搭建工作台">
        <div class="scene-topline"><span class="scene-label"><span class="scene-status-dot"></span><span id="scene-label">自由探索</span></span><div class="scene-top-actions"><button class="small-icon" data-action="reset-view" aria-label="回到初始视角" title="回到初始视角">${icon('reset')}</button><button class="small-icon" data-action="fullscreen" aria-label="全屏观察" title="全屏观察">${icon('full')}</button></div></div>
        <div id="scene" class="scene"></div>
        <div class="scene-empty" id="scene-empty" hidden>${icon('cube')}<strong>想象，从第一块开始</strong><span>选择“添加”，点击地面放下一块积木。</span></div>
        <div class="view-corner"><span class="orientation-cube">${icon('cube')}</span><span>题目前方保持固定</span></div>
        <div class="zoom-controls"><button data-action="zoom-in" aria-label="放大">${icon('plus')}</button><span></span><button data-action="zoom-out" aria-label="缩小">${icon('minus')}</button></div>
        <div class="canvas-toolbar" role="toolbar" aria-label="搭建工具"><button class="mobile-tools" data-action="tools">${icon('tools')}<span>工具</span></button><button data-tool="orbit" class="active" title="拖动旋转">${icon('orbit')}<span>旋转</span></button><button data-tool="add" title="点击方块的面或空地添加">${icon('plus')}<span>添加</span></button><button data-tool="remove" title="点击方块移除">${icon('remove')}<span>移除</span></button><button data-tool="paint" title="点击方块换色">${icon('paint')}<span>换色</span></button><span class="toolbar-divider"></span><button data-action="undo" aria-label="撤销" title="撤销（Ctrl+Z）">${icon('undo')}</button><button data-action="redo" aria-label="重做" title="重做（Ctrl+Shift+Z）">${icon('redo')}</button></div>
      </section>
      <div class="view-controls" role="group" aria-label="观察方向"><span class="view-label">观察视角</span><button data-view="free" class="active">${icon('orbit')}自由</button><button data-view="front">${icon('front')}从前看</button><button data-view="left">${icon('front')}从左看</button><button data-view="top">${icon('top')}从上看</button><div class="more-views"><button data-action="more-views" aria-expanded="false" aria-label="更多观察方向">${icon('chevrondown')}</button><div class="more-menu" hidden><button data-view="back">从后看</button><button data-view="right">从右看</button><button data-view="bottom">从下看</button></div></div></div>
      <div class="scene-footer"><span>${icon('hand')}<span class="desktop-hint">拖动旋转 · 滚轮缩放 · 点击积木的面添加</span><span class="touch-hint">单指旋转 · 双指缩放 · 添加时轻点预览，再点放置</span></span><button data-action="clear">${icon('trash')}重新搭建</button></div>
      <div class="bottom-insight"><span class="insight-number">01</span><div><strong id="insight-title">眼睛看到的，不一定是全部。</strong><span id="insight-text">转一转，看看有没有藏在后面的积木？</span></div><span class="insight-art">${icon('eye')}</span></div>
    </main>
    <aside class="learning-panel" id="learning-panel"></aside>
  </div>
  <footer class="app-footer"><span><span class="footer-dot"></span> 在探索中，长出空间想象力。</span><span>方见 · 让抽象，变得看得见</span></footer>
  <div class="toolbox-overlay" data-action="tools"></div>
  <div class="toast" role="status" aria-live="polite" id="toast"></div>
  <dialog id="help-dialog"><div class="dialog-top"><span class="dialog-icon">${icon('hand')}</span><button class="icon-btn" data-action="close-help" aria-label="关闭帮助">${icon('close')}</button></div><h2>给想象，一点操作空间。</h2><div class="help-steps"><p><b>01　搭起来</b><span>选择“添加”，点地面或已有积木的外侧面。手机上先点预览，再点同一处确认。</span></p><p><b>02　转一转</b><span>单指或鼠标拖动旋转，双指捏合或滚轮缩放。标准视角会自动转到题目指定方向。</span></p><p><b>03　想一想</b><span>进入“动手做题”先预测再验证；进入“一起讲解”，点击视图格子看哪些方块重叠。</span></p></div><p class="help-note">作品仅保存在当前浏览器。导出 JSON 后，可在其他设备导入。工作台支持 9 × 9 的搭建范围，最高七层。</p><button class="primary-btn" data-action="close-help">开始探索 ${icon('arrow')}</button></dialog>
`;

let scene:BlockScene|undefined;
try { scene=new BlockScene(document.querySelector('#scene')!, next=>commit(next));scene.onHint=toast; } catch(e) { document.querySelector('#scene')!.innerHTML='<div class="webgl-error"><strong>暂时无法创建 3D 画面</strong><p>请使用支持 WebGL 的浏览器，并开启硬件加速。二维视图仍可查看。</p></div>';console.error(e); }

const viewNames:Record<View,string>={front:'从前面看',left:'从左面看',top:'从上面看'};
function toast(message:string){const el=document.querySelector('#toast')!;el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3800);}
function setTool(next:Tool){tool=next;scene?.setTool(next);document.querySelectorAll('[data-tool]').forEach(el=>{el.classList.toggle('active',(el as HTMLElement).dataset.tool===next);el.setAttribute('aria-pressed',String((el as HTMLElement).dataset.tool===next));});}
function commit(next:Cube[]){if(!validScene(next)){toast('模型数据超出当前支持范围。');return;}if(mode==='practice'&&task==='draw'){toast('这道题请在右侧格子上画出正面图形。');return;}history.push(clone(cubes));if(history.length>80)history.shift();future=[];cubes=clone(next);dirty=true;feedback=null;highlightCell=null;selectedPreset=-1;update();}
function replace(next:Cube[]){cubes=clone(next);history=[];future=[];selectedPreset=-1;selectedCells.clear();feedback=null;highlightCell=null;revealed=false;update();}
function projectionSvg(list:Cube[],view:View,interactive=false,answer=false){
  const coords=list.map(c=>projected(c,view));
  const minU=coords.length?Math.min(...coords.map(c=>c[0])):0,maxU=coords.length?Math.max(...coords.map(c=>c[0])):1;
  const minV=coords.length?Math.min(...coords.map(c=>c[1])):0,maxV=coords.length?Math.max(...coords.map(c=>c[1])):1;
  const cols=maxU-minU+1,rows=maxV-minV+1;
  const size=24,pad=10,w=Math.max(cols*size+pad*2,100),h=Math.max(rows*size+pad*2,76),ox=(w-cols*size)/2,oy=(h-rows*size)/2;
  const cells=project(list,view);
  let content='';
  for(let u=minU;u<=maxU;u++)for(let v=minV;v<=maxV;v++){
    const k=`${u},${v}`,occupied=cells.has(k),x=ox+(u-minU)*size,y=oy+(maxV-v)*size;
    if(occupied){const hl=highlightCell===k&&highlightView===view;content+=`<rect x="${x+.9}" y="${y+.9}" width="${size-1.8}" height="${size-1.8}" rx="2.5" fill="${hl?'#ffcb87':answer?'#a5b0ed':'#c6cef4'}" stroke="${hl?'#d99b4a':'#8f9ed8'}" stroke-width="1.1" ${interactive?`data-cell="${k}" data-cell-view="${view}" tabindex="0" role="button" aria-label="${viewNames[view]}，格子 ${u-minU+1} 列 ${maxV-v+1} 行，点击查看对应积木"`:''}/>`;}
    else content+=`<rect x="${x+1}" y="${y+1}" width="${size-2}" height="${size-2}" rx="2" fill="#f6f7fc" stroke="#e6e9f2" stroke-dasharray="2 3"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" class="projection-svg" ${interactive?'':'role="img"'} aria-label="${viewNames[view]}，共 ${cells.size} 格">${content}</svg>`;
}
function projections(list:Cube[],interactive=false){return `<div class="projection-list">${(['front','left','top'] as View[]).map((v,i)=>`<div class="projection-card"><div class="projection-card-head"><span class="view-dot view-dot-${i}"></span><strong>${viewNames[v]}</strong><span>${project(list,v).size} 格</span></div><div class="projection-image">${projectionSvg(list,v,interactive)}</div><button class="projection-link" data-view="${v}">转到${['正面','左面','上面'][i]} ${icon('arrow')}</button></div>`).join('')}</div>`;}
function stats(){return `<div class="model-stats"><div><span>${icon('cube')}积木数量</span><strong>${cubes.length}<small>块</small></strong></div><span class="stats-divider"></span><div><span>${icon('layers')}最高层数</span><strong>${cubes.length?Math.max(...cubes.map(c=>c.y))+1:0}<small>层</small></strong></div></div>`;}
function buildPanel(){return `<div class="learning-heading"><span class="eyebrow">A NEW PERSPECTIVE</span><h2>立体的另一面</h2><p>同一个形状，不一样的观察。</p></div><div class="panel-section-title">${icon('grid')}实时三视图<span class="live-badge">同步中</span></div>${projections(cubes,true)}${stats()}<div class="learning-tip"><span>${icon('bulb')}</span><p><strong>小发现</strong>点击视图里的蓝色格子，看看它对应哪些积木。</p></div>`;}
function feedbackHtml(){return feedback?`<div class="answer-feedback ${feedback.correct?'correct':'try-again'}" role="status">${icon(feedback.correct?'check':'bulb')}<div><strong>${feedback.correct?'发现规律啦！':'再观察一下'}</strong><p>${feedback.reason}</p></div></div>`:'';}
function drawGrid(){
  const list=exerciseBase,coords=list.map(c=>projected(c,'front')),minX=Math.min(...coords.map(c=>c[0])),maxX=Math.max(...coords.map(c=>c[0])),maxY=Math.max(...coords.map(c=>c[1]));
  let content='';for(let y=maxY+1;y>=0;y--)for(let x=minX;x<=maxX+1;x++){const k=`${x},${y}`;content+=`<button class="answer-cell ${selectedCells.has(k)?'filled':''}" data-answer-cell="${k}" aria-label="第 ${x-minX+1} 列，第 ${maxY+2-y} 行" aria-pressed="${selectedCells.has(k)}"></button>`;}
  return `<div class="answer-grid" style="grid-template-columns:repeat(${maxX-minX+2},38px)">${content}</div>`;
}
function practicePanel(){const draw=task==='draw';return `<div class="learning-heading"><span class="eyebrow">THINK · BUILD · DISCOVER</span><h2>先想一想，再试一试</h2><p>每一次尝试，都离答案更近一点。</p></div><label class="task-label" for="task-select">今天的小挑战</label><div class="select-wrap"><select id="task-select"><option value="draw" ${draw?'selected':''}>看立体，画出正面</option><option value="add" ${!draw?'selected':''}>加一块，左视图不变</option></select>${icon('chevrondown')}</div><div class="question-card"><span class="question-tag">挑战 ${draw?'01':'02'} · 观察与想象</span><h3>${draw?'从前面看，会是什么形状？':'多一块，形状能不变吗？'}</h3><p>${draw?'观察工作台中的组合体，在下面的格子里画出它的正面图形。点击格子填色，再点一次取消。':'保留原来的四个方块，只添加一个正方体，让从左面看到的图形保持不变。'}</p></div>${draw?`<div class="answer-area"><span class="section-label">我眼中的正面</span>${drawGrid()}<span class="grid-caption">格子底边对应地面，不需要填满。</span></div>`:`<div class="target-view"><span class="section-label">原来的左视图 · 保持这个形状</span>${projectionSvg(exerciseBase,'left')}<span class="grid-caption">当前 ${cubes.length} 块，目标 ${exerciseBase.length+1} 块</span></div>`}<button class="primary-btn check-answer" data-action="check-answer">${icon('check')}检查我的答案</button>${feedbackHtml()}<div class="practice-actions"><button data-action="hint">${icon('bulb')}给我一点提示</button><button data-action="restart-task">${icon('reset')}重新尝试</button></div>${revealed?`<div class="reveal-answer"><strong>一起看看${draw?'正面':'左面'}</strong>${projectionSvg(draw?exerciseBase:cubes,draw?'front':'left',true,true)}<p>${draw?'从前面看，前后重叠的方块只占一个格子。':'同一高度、同一前后位置的方块，从左面看会投影到同一格。'}</p><button class="text-btn" data-mode="explain">进入讲解 ${icon('arrow')}</button></div>`:''}<div class="practice-note">${icon('lock')}正确与否由方块位置和投影判断。</div>`;}
function explainPanel(){
  const steps=[{title:'先选定观察方向',text:'题目前方始终固定。点击“从前看”，把眼睛移动到模型正前方。',action:'转到正前方',icon:'eye'},{title:'找出重叠的积木',text:'点击下方任意蓝色格子。对应的积木会高亮，其余积木淡化，看看一格背后藏着几块。',action:'演示一个重叠格',icon:'layers'},{title:'换个角度，验证发现',text:'回到自由视角，保留高亮。转一转，你会发现这些积木原本就沿观察方向排在一起。',action:'回到立体观察',icon:'orbit'}];const step=steps[explainStep];
  return `<div class="learning-heading"><span class="eyebrow">MAKE THE INVISIBLE VISIBLE</span><h2>把“为什么”看明白</h2><p>用眼睛观察，也用双手验证。</p></div><div class="explain-progress">${steps.map((s,i)=>`<button class="${explainStep===i?'active':''} ${explainStep>i?'done':''}" data-step="${i}" aria-label="第 ${i+1} 步：${s.title}">${explainStep>i?icon('check'):i+1}</button>${i<2?'<span></span>':''}`).join('')}</div><div class="explain-card"><span class="question-tag">一起发现 · 第 ${explainStep+1} 步</span><h3>${step.title}</h3><p>${step.text}</p><button class="primary-btn" data-action="explain-action">${icon(step.icon)}${step.action}</button></div><div class="panel-section-title">${icon('grid')}点格子，找积木${highlightCell?'<button class="text-btn" data-action="clear-highlight">取消高亮</button>':''}</div>${projections(cubes,true)}<div class="highlight-info">${icon('bulb')}<p>${highlightCell?highlightDescription():'同一格可能对应好几块积木，点击试试看。'}</p></div><div class="step-navigation"><button data-action="previous-step" ${explainStep===0?'disabled':''}>上一步</button><button data-action="next-step" ${explainStep===2?'disabled':''}>下一步 ${icon('arrow')}</button></div>`;
}
function highlightDescription(){const count=cubes.filter(c=>projected(c,highlightView).join(',')===highlightCell).length;return `<strong>${count} 块积木，${count>1?'重叠成':'投影成'} 1 个格子。</strong>${count>1?'沿这个方向观察，它们会互相遮挡。':'试试其他格子，找找有没有重叠。'}`;}
function update(){
  scene?.setCubes(cubes);if(scene){scene.locked=mode==='practice'&&task==='draw';scene.color=color;if(highlightCell)scene.highlight(highlightView,highlightCell);}
  document.querySelector('#learning-panel')!.innerHTML=mode==='build'?buildPanel():mode==='practice'?practicePanel():explainPanel();
  document.querySelector('#scene-empty')!.toggleAttribute('hidden',cubes.length>0);
  document.querySelectorAll('[data-action="undo"]').forEach(el=>(el as HTMLButtonElement).disabled=!history.length||(mode==='practice'&&task==='draw'));
  document.querySelectorAll('[data-action="redo"]').forEach(el=>(el as HTMLButtonElement).disabled=!future.length||(mode==='practice'&&task==='draw'));
  document.querySelectorAll('[data-preset]').forEach(el=>el.classList.toggle('active',Number((el as HTMLElement).dataset.preset)===selectedPreset));
  document.querySelectorAll('.canvas-toolbar [data-tool]').forEach(el=>(el as HTMLButtonElement).disabled=mode==='practice'&&task==='draw'&&(el as HTMLElement).dataset.tool!=='orbit');
  document.querySelector('#scene-badge')!.textContent=mode==='build'?'3D 互动工作台':mode==='practice'?'先思考，再验证':'让隐藏的关系浮现';
  document.querySelector('#scene-label')!.textContent=mode==='build'?'自由探索':mode==='practice'?'挑战进行中':'讲解与发现';
  const titles:Record<Mode,string>={build:'换个角度，<span>看见不同。</span>',practice:'动手尝试，<span>找到答案。</span>',explain:'一起观察，<span>发现规律。</span>'};
  document.querySelector('#main-title')!.innerHTML=titles[mode];
  document.querySelector('#main-description')!.textContent=mode==='build'?'搭出脑海里的形状，让空间变得触手可及。':mode==='practice'?'先在脑海里转一转，再用双手验证你的想法。':'让每一块积木，都成为看得见的解释。';
  document.querySelector('#heading-kicker')!.textContent=mode==='build'?'想象力，正在搭建中':mode==='practice'?'小小挑战，等你发现':'带着问题，换个角度';
  document.querySelector('#mobile-question')!.textContent=mode==='practice'?(task==='draw'?'观察模型，在下方格子画出正面。':'保留原来的四块，增加一块，让左视图不变。'):'';
  document.body.dataset.mode=mode;
  document.querySelector('#insight-title')!.textContent=mode==='explain'?'一格背后，也许不止一块。':'眼睛看到的，不一定是全部。';
  document.querySelector('#insight-text')!.textContent=mode==='practice'?'不着急看答案，先说说你是怎么想的。':'转一转，看看有没有藏在后面的积木？';
}
function changeMode(next:Mode){
  if(next===mode)return;
  if(next==='practice'&&mode!=='practice'){if(!savedBuild)savedBuild=clone(cubes);exerciseBase=clone(PRESETS[1].cubes);mode=next;replace(exerciseBase);setTool(task==='add'?'add':'orbit');scene?.reset();}
  else {mode=next;if(next==='build')highlightCell=null;if(next==='build'&&savedBuild){replace(savedBuild);savedBuild=null;}else update();setTool('orbit');}
  document.querySelectorAll('.mode-switch [data-mode]').forEach(el=>{el.classList.toggle('active',(el as HTMLElement).dataset.mode===next);el.setAttribute('aria-pressed',String((el as HTMLElement).dataset.mode===next));});
  document.body.classList.remove('tools-open');
}
function chooseView(view:string){scene?.view(view as View|'free');document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',(el as HTMLElement).dataset.view===view));document.querySelector('.more-menu')!.setAttribute('hidden','');document.querySelector('[data-action="more-views"]')!.setAttribute('aria-expanded','false');}
function showHighlight(view:View,cell:string){highlightView=view;highlightCell=cell;scene?.highlight(view,cell);document.querySelector('#learning-panel')!.innerHTML=mode==='build'?buildPanel():mode==='practice'?practicePanel():explainPanel();if(mode==='build')toast(`${viewNames[view]}：${cubes.filter(c=>projected(c,view).join(',')===cell).length} 块积木投影到这个格子。`);}
function showExampleOverlap(){let found:{view:View;cell:string}|null=null;for(const view of ['front','left','top'] as View[]){const cells=project(cubes,view);for(const cell of cells)if(cubes.filter(c=>projected(c,view).join(',')===cell).length>1){found={view,cell};break;}if(found)break;}if(found){chooseView(found.view);showHighlight(found.view,found.cell);}else toast('这个模型暂时没有重叠格，可以先到自由搭建模式添加前后排列的方块。');}
function save(){try{localStorage.setItem('fangjian-scene-v1',JSON.stringify(mode==='practice'&&savedBuild?savedBuild:cubes));dirty=false;toast('作品已保存在当前浏览器。');}catch{toast('浏览器无法保存，请使用“导出”保留作品。');}}
function exportScene(){const blob=new Blob([JSON.stringify({version:1,name:'方见作品',cubes:mode==='practice'&&savedBuild?savedBuild:cubes},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='fangjian-model.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('作品已导出，可在其他设备导入。');}
document.addEventListener('click',e=>{
  const el=(e.target as Element).closest<HTMLElement>('button, [data-cell]');if(!el)return;
  const d=el.dataset;
  if(d.mode){changeMode(d.mode as Mode);return;}
  if(d.tool){if(mode==='practice'&&task==='draw'&&d.tool!=='orbit'){toast('先完成这道题，或切换到自由搭建。');return;}setTool(d.tool as Tool);return;}
  if(d.color){color=d.color;scene&&(scene.color=color);document.querySelectorAll('[data-color]').forEach(c=>{c.classList.toggle('active',(c as HTMLElement).dataset.color===color);c.setAttribute('aria-pressed',String((c as HTMLElement).dataset.color===color));});document.querySelector('#color-name')!.textContent=['鸢尾蓝','薄荷绿','杏子橙','蔷薇粉','晴空蓝'][COLORS.indexOf(color)];return;}
  if(d.preset!==undefined){if(mode==='practice'){toast('做题时不能更换模型，请先切换到自由搭建。');return;}const i=Number(d.preset);commit(PRESETS[i].cubes);selectedPreset=i;update();scene?.reset();document.body.classList.remove('tools-open');toast(`已载入“${PRESETS[i].name}”，可撤销返回之前的模型。`);return;}
  if(d.view){chooseView(d.view);return;}
  if(d.cell){showHighlight(d.cellView as View,d.cell);return;}
  if(d.answerCell){if(selectedCells.has(d.answerCell))selectedCells.delete(d.answerCell);else selectedCells.add(d.answerCell);feedback=null;document.querySelector('#learning-panel')!.innerHTML=practicePanel();return;}
  if(d.step!==undefined){explainStep=Number(d.step);update();return;}
  switch(d.action){
    case 'save':save();break;
    case 'export':exportScene();break;
    case 'import':if(mode==='practice')toast('请先回到自由搭建，再导入作品。');else(document.querySelector('#import-file') as HTMLInputElement).click();break;
    case 'help':(document.querySelector('#help-dialog') as HTMLDialogElement).showModal();break;
    case 'close-help':(document.querySelector('#help-dialog') as HTMLDialogElement).close();break;
    case 'tools':document.body.classList.toggle('tools-open');break;
    case 'undo':if(history.length){future.push(clone(cubes));cubes=history.pop()!;dirty=true;feedback=null;highlightCell=null;update();}break;
    case 'redo':if(future.length){history.push(clone(cubes));cubes=future.pop()!;dirty=true;feedback=null;highlightCell=null;update();}break;
    case 'clear':if(mode==='practice')toast('做题时请使用“重新尝试”恢复题目。');else{commit([]);setTool('add');}break;
    case 'reset-view':scene?.reset();chooseView('free');break;
    case 'zoom-in':scene?.zoom(1.15);break;
    case 'zoom-out':scene?.zoom(1/1.15);break;
    case 'fullscreen':{const card=document.querySelector('.scene-card')!;if(document.fullscreenElement){void document.exitFullscreen();}else if(card.requestFullscreen){void card.requestFullscreen().catch(()=>toast('当前浏览器不支持全屏，可尝试横屏观察。'));}else toast('当前浏览器不支持全屏，可尝试横屏观察。');break;}
    case 'more-views':{const menu=document.querySelector('.more-menu')!;const open=menu.hasAttribute('hidden');menu.toggleAttribute('hidden',!open);el.setAttribute('aria-expanded',String(open));break;}
    case 'check-answer':feedback=task==='draw'?{correct:equal(selectedCells,project(exerciseBase,'front')),reason:equal(selectedCells,project(exerciseBase,'front'))?'答对了！从前面看，前后重叠的方块只占一个格子。':'还没有完全吻合。注意底部对齐地面，前后重叠的方块只画一格。'}:checkAddition(exerciseBase,cubes,'left');if(feedback.correct)revealed=true;document.querySelector('#learning-panel')!.innerHTML=practicePanel();break;
    case 'hint':revealed=true;document.querySelector('#learning-panel')!.innerHTML=practicePanel();if(task==='add')chooseView('left');else chooseView('front');toast(task==='add'?'试着在相同高度、相同前后位置，沿左右方向增加一块。':'从正前方观察，先找地面一排，再看上面还有几格。');break;
    case 'restart-task':replace(exerciseBase);setTool(task==='add'?'add':'orbit');scene?.reset();break;
    case 'clear-highlight':highlightCell=null;scene?.clearHighlight();document.querySelector('#learning-panel')!.innerHTML=mode==='explain'?explainPanel():buildPanel();break;
    case 'previous-step':explainStep=Math.max(0,explainStep-1);update();break;
    case 'next-step':explainStep=Math.min(2,explainStep+1);update();break;
    case 'explain-action':if(explainStep===0)chooseView('front');else if(explainStep===1)showExampleOverlap();else chooseView('free');break;
  }
});
document.querySelector('.toolbox-overlay')!.addEventListener('click',()=>document.body.classList.remove('tools-open'));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){document.body.classList.remove('tools-open');scene?.clearHighlight();highlightCell=null;}
  if((e.key==='Enter'||e.key===' ')&&(e.target as HTMLElement).dataset.cell){e.preventDefault();const d=(e.target as HTMLElement).dataset;showHighlight(d.cellView as View,d.cell!);}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z' && !['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)){e.preventDefault();(document.querySelector(`[data-action="${e.shiftKey?'redo':'undo'}"]`) as HTMLButtonElement).click();}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}
});
document.addEventListener('change',async e=>{
  const el=e.target as HTMLInputElement;
  if(el.id==='task-select'){task=el.value;replace(exerciseBase);setTool(task==='add'?'add':'orbit');scene?.reset();}
  if(el.id==='import-file'&&el.files?.[0]){try{if(el.files[0].size>150000)throw Error('size');const value=JSON.parse(await el.files[0].text());const next=Array.isArray(value)?value:value.cubes;if(!validScene(next))throw Error('format');commit(next);scene?.reset();toast('作品已导入，可以继续搭建。');}catch{toast('无法导入：请选择方见导出的有效 JSON 模型文件（不超过 150 KB）。');}el.value='';}
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();}});
update();setTool('orbit');scene?.reset();
