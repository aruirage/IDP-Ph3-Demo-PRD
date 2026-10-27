export function enhanceDiagrams(container) {
  if (!document.getElementById('diagram-zoom-style')) {
    const style = document.createElement('style'); style.id = 'diagram-zoom-style';
    style.textContent = `.diagram-viewer{border:1px solid #dce2eb;border-radius:6px;margin:18px 0;background:white;min-width:0}.diagram-toolbar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #e5e7eb}.diagram-toolbar button{padding:4px 10px;border:1px solid #d0d5dd;border-radius:4px;background:white;color:#344054;cursor:pointer;font:inherit;font-size:13px}.diagram-toolbar output{min-width:48px;text-align:center;font-size:13px}.diagram-viewport{overflow:auto;max-height:600px;padding:16px;cursor:grab;touch-action:pan-x pan-y}.diagram-viewport.dragging{cursor:grabbing;user-select:none}.diagram-viewport>.mermaid{min-width:0!important;width:max-content!important;margin:0!important;padding:0!important;overflow:visible!important}.diagram-viewport svg{display:block;max-width:none!important;min-width:0!important;height:auto}.diagram-viewer:focus-within{border-color:#84adff}.diagram-dialog{width:96vw;max-width:none;height:94vh;max-height:none;padding:16px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#202939}.diagram-dialog::backdrop{background:rgba(16,24,40,.45)}.diagram-dialog-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.diagram-dialog-head button{font:inherit;border:1px solid #d0d5dd;border-radius:4px;padding:6px 14px;background:white;cursor:pointer}.diagram-dialog .diagram-viewer{margin:0;height:calc(100% - 48px);display:flex;flex-direction:column}.diagram-dialog .diagram-viewport{height:auto;max-height:none;flex:1;min-height:0}.diagram-placeholder{min-height:100px}@media print{.diagram-toolbar{display:none}.diagram-viewport{max-height:none;overflow:visible;padding:0}.diagram-viewport>.mermaid{width:100%!important}.diagram-viewport svg{width:100%!important;height:auto!important}}`;
    document.head.append(style);
  }
  container.querySelectorAll('.mermaid').forEach(diagram => {
    const svg = diagram.querySelector('svg');
    if (!svg || diagram.closest('.diagram-viewer')) return;
    const box = svg.viewBox.baseVal;
    const width = box.width || svg.getBoundingClientRect().width || 800;
    const height = box.height || svg.getBoundingClientRect().height || 400;
    const wrapper = document.createElement('div'); wrapper.className = 'diagram-viewer';
    wrapper.innerHTML = `<div class="diagram-toolbar" role="group" aria-label="流程图缩放"><button type="button" data-action="minus" aria-label="缩小流程图">−</button><output aria-live="polite"></output><button type="button" data-action="plus" aria-label="放大流程图">＋</button><button type="button" data-action="fit">适应宽度</button><button type="button" data-action="reset">重置</button><button type="button" data-action="expand">放大查看</button></div><div class="diagram-viewport" tabindex="0" aria-label="流程图，放大后可拖动查看"></div>`;
    diagram.before(wrapper); const viewport = wrapper.querySelector('.diagram-viewport'); viewport.append(diagram);
    let zoom = 1;
    function apply(value) {
      zoom = Math.min(5, Math.max(.05, value));
      svg.style.setProperty('width', `${width * zoom}px`, 'important');
      svg.style.setProperty('height', `${height * zoom}px`, 'important');
      wrapper.querySelector('output').textContent = `${Math.round(zoom * 100)}%`;
    }
    let dialog=null;
    function openLarge(){
      if(dialog){dialog.close();return}
      const previousZoom=zoom,previousScroll={left:viewport.scrollLeft,top:viewport.scrollTop};
      const placeholder=document.createElement('div');placeholder.className='diagram-placeholder';placeholder.style.height=wrapper.getBoundingClientRect().height+'px';wrapper.before(placeholder);
      dialog=document.createElement('dialog');dialog.className='diagram-dialog';dialog.setAttribute('aria-label','放大查看流程图');dialog.innerHTML='<div class="diagram-dialog-head"><strong>流程图</strong><button type="button" aria-label="关闭放大查看">关闭</button></div>';
      const activeDialog=dialog;document.body.append(dialog);dialog.append(wrapper);wrapper.querySelector('[data-action="expand"]').textContent='关闭放大';dialog.querySelector('.diagram-dialog-head button').addEventListener('click',()=>activeDialog.close());
      dialog.addEventListener('close',()=>{placeholder.replaceWith(wrapper);dialog=null;wrapper.querySelector('[data-action="expand"]').textContent='放大查看';apply(previousZoom);viewport.scrollLeft=previousScroll.left;viewport.scrollTop=previousScroll.top;activeDialog.remove();wrapper.querySelector('[data-action="expand"]').focus()},{once:true});
      dialog.showModal();apply(Math.min(1,(viewport.clientWidth-32)/width));viewport.scrollTo(0,0);
    }
    svg.addEventListener('dblclick',event=>{if(!event.target.closest('a'))openLarge()});
    viewport.addEventListener('keydown',event=>{if(event.key==='+'||event.key==='='){event.preventDefault();apply(zoom*1.25)}if(event.key==='-'){event.preventDefault();apply(zoom/1.25)}});
    wrapper.querySelector('.diagram-toolbar').addEventListener('click', event => {
      const action = event.target.closest('button')?.dataset.action;
      if (action === 'expand') openLarge();
      if (action === 'plus') apply(zoom * 1.25);
      if (action === 'minus') apply(zoom / 1.25);
      if (action === 'reset') apply(1);
      if (action === 'fit') apply((viewport.clientWidth - 32) / width);
    });
    let drag;
    viewport.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('a')) return;
      drag = { x:event.clientX, y:event.clientY, left:viewport.scrollLeft, top:viewport.scrollTop };
      viewport.setPointerCapture(event.pointerId); viewport.classList.add('dragging'); event.preventDefault();
    });
    viewport.addEventListener('pointermove', event => {
      if (!drag) return;
      viewport.scrollLeft = drag.left + drag.x - event.clientX;
      viewport.scrollTop = drag.top + drag.y - event.clientY;
    });
    const stop = () => { drag = null; viewport.classList.remove('dragging'); };
    viewport.addEventListener('pointerup', stop); viewport.addEventListener('pointercancel', stop);
    apply(viewport.clientWidth > 32 ? Math.min(1, (viewport.clientWidth - 32) / width) : 1);
  });
}
