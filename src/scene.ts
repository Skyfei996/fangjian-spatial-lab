import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { bounded, key, projected, type Cube, type View } from './geometry';

export type Tool = 'orbit' | 'add' | 'remove' | 'paint';
export class BlockScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-6, 6, 6, -6, .1, 100);
  controls: OrbitControls;
  group = new THREE.Group();
  cubes: Cube[] = [];
  meshes: THREE.Mesh[] = [];
  tool: Tool = 'orbit';
  color = '#8392ed';
  locked = false;
  onEdit: (cubes: Cube[]) => void;
  ray = new THREE.Raycaster();
  floor: THREE.Mesh;
  ghost: THREE.Mesh;
  geometry: THREE.ExtrudeGeometry;
  frame = 0;
  private tween?: { start: number; from: THREE.Vector3; to: THREE.Vector3; up: THREE.Vector3 };
  private observer: ResizeObserver;
  private down?: { x: number; y: number; pointer: number; moved: boolean };
  private pointers = new Set<number>();
  private pending: Cube | null = null;
  private pendingRemove: string | null = null;
  onHint: (text: string) => void = () => {};

  constructor(public host: HTMLElement, onEdit: (cubes: Cube[]) => void) {
    this.onEdit = onEdit;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.setAttribute('aria-label', '可旋转的三维方块模型');
    this.renderer.domElement.style.touchAction = 'none';
    host.append(this.renderer.domElement);
    this.camera.position.set(8, 6, 10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, .7, -.2);
    this.controls.enableDamping = true;
    this.controls.minZoom = .28;
    this.controls.maxZoom = 3;
    this.controls.maxPolarAngle = Math.PI * .94;
    this.controls.addEventListener('start', () => { this.tween = undefined; });
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xa5adbc, 2.7));
    const sun = new THREE.DirectionalLight(0xffffff, 3.2);
    sun.position.set(-4, 9, 6); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .1, far: 30 });
    sun.shadow.normalBias = .025;
    sun.shadow.bias = -.0001;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd9e2ff, 1.3); fill.position.set(6, 3, -4); this.scene.add(fill);
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: '#eef0f7', roughness: .95, transparent: true, opacity: .85 }));
    this.floor.rotation.x = -Math.PI / 2; this.floor.position.y = -.015; this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    const grid = new THREE.GridHelper(10, 10, '#cdd3e4', '#dce0eb'); grid.position.set(0, .001, 0);
    // Integer coordinates denote cell centres, so grid boundaries sit at half-integers.
    grid.position.x = .5; grid.position.z = .5; this.scene.add(grid);
    this.addLabel('前', 0, 4.7, '#6875b2');
    this.addLabel('后', 0, -4.5, '#9ca6ba');
    this.addLabel('左', -4.5, .2, '#9ca6ba');
    this.addLabel('右', 4.5, .2, '#9ca6ba');
    const shape = new THREE.Shape();
    shape.moveTo(-.465, -.465); shape.lineTo(.465, -.465); shape.lineTo(.465, .465); shape.lineTo(-.465, .465); shape.closePath();
    this.geometry = new THREE.ExtrudeGeometry(shape, { depth: .93, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .025, bevelThickness: .025 });
    this.geometry.translate(0, 0, -.465);
    this.scene.add(this.group);
    this.ghost = new THREE.Mesh(new THREE.BoxGeometry(.99,.99,.99), new THREE.MeshBasicMaterial({ color: '#7986df', transparent: true, opacity: .26, depthWrite: false }));
    this.ghost.visible = false; this.scene.add(this.ghost);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('pointerdown', e => {
      this.pointers.add(e.pointerId);
      if (this.pointers.size > 1) { if (this.down) this.down.moved = true; this.clearPreview(); return; }
      this.down = { x:e.clientX,y:e.clientY,pointer:e.pointerId,moved:false };
    });
    canvas.addEventListener('pointermove', e => {
      if (this.down && Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)>7) this.down.moved = true;
      if (e.pointerType === 'mouse' && this.pointers.size === 0) this.preview(e);
    });
    canvas.addEventListener('pointerup', e => {
      const clicked = this.down && this.down.pointer === e.pointerId && !this.down.moved && this.pointers.size === 1 && e.button === 0;
      this.pointers.delete(e.pointerId);
      if (clicked && !this.locked && this.tool !== 'orbit') this.edit(e);
      if (this.down?.pointer === e.pointerId) this.down = undefined;
    });
    canvas.addEventListener('pointercancel', e => { this.pointers.delete(e.pointerId); this.down=undefined; this.clearPreview(); });
    canvas.addEventListener('pointerleave', () => this.ghost.visible=false);
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host);
    this.resize(); this.animate();
  }
  private addLabel(text: string, x: number, z: number, color: string) {
    const cv=document.createElement('canvas'); cv.width=128; cv.height=128;
    const ctx=cv.getContext('2d')!; ctx.font='600 60px sans-serif'; ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,64,64);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.52,.52),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.015,z);this.scene.add(mesh);
  }
  resize() {
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
    const size = w<500 ? 3.65 : 3.85;
    this.camera.left=-size*w/h;this.camera.right=size*w/h;this.camera.top=size;this.camera.bottom=-size;
    this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);
  }
  setCubes(cubes: Cube[]) {
    this.clearPreview(); this.cubes=cubes.map(c=>({...c}));
    for (const mesh of this.meshes) { this.group.remove(mesh); (mesh.material as THREE.Material).dispose(); const edge=mesh.children[0] as THREE.LineSegments|undefined;if(edge){edge.geometry.dispose();(edge.material as THREE.Material).dispose();} }
    this.meshes=[];
    for(const c of cubes){
      const mat=new THREE.MeshStandardMaterial({color:c.color,roughness:.58,metalness:0});
      const mesh=new THREE.Mesh(this.geometry,mat);mesh.position.set(c.x,c.y+.5,c.z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.cube=c;
      const edgeBox = new THREE.BoxGeometry(.983,.983,.983);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(edgeBox),new THREE.LineBasicMaterial({color:new THREE.Color(c.color).multiplyScalar(.72),transparent:true,opacity:.32}));
      edgeBox.dispose();
      mesh.add(edge); this.group.add(mesh);this.meshes.push(mesh);
    }
  }
  setTool(tool: Tool) { this.tool=tool;this.clearPreview();this.renderer.domElement.style.cursor=tool==='orbit'?'grab':'crosshair'; }
  private cast(e: PointerEvent) {
    const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);
    return this.ray.intersectObjects(this.meshes,false)[0];
  }
  private candidate(e: PointerEvent): Cube | null {
    const hit=this.cast(e);
    let c: Cube;
    if(hit && hit.face){ const old=hit.object.userData.cube as Cube; const n=hit.face.normal;
      const axis = Math.abs(n.x)>Math.abs(n.y) && Math.abs(n.x)>Math.abs(n.z)?'x':Math.abs(n.y)>Math.abs(n.z)?'y':'z';
      c={...old,color:this.color}; c[axis]+=Math.sign(n[axis]);
    } else { const floor=this.ray.intersectObject(this.floor)[0]; if(!floor)return null;c={x:Math.round(floor.point.x),y:0,z:Math.round(floor.point.z),color:this.color}; }
    return bounded(c)&&!this.cubes.some(old=>key(c)===key(old))?c:null;
  }
  private preview(e: PointerEvent) { if(this.tool!=='add'||this.locked){this.ghost.visible=false;return;}const c=this.candidate(e);this.ghost.visible=!!c;if(c)this.ghost.position.set(c.x,c.y+.5,c.z); }
  clearPreview(){if(this.pendingRemove)this.clearHighlight();this.pending=null;this.pendingRemove=null;this.ghost.visible=false;}
  private edit(e: PointerEvent) {
    if(this.tool==='add'){
      const c=this.candidate(e);if(!c){this.onHint('这里无法放置。请点空地或方块的外侧面，最高可搭七层。');return;}
      if(this.cubes.length>=300){this.onHint('当前工作台最多容纳 300 个方块。');return;}
      if(e.pointerType==='touch' && (!this.pending||key(this.pending)!==key(c))){this.pending=c;this.ghost.position.set(c.x,c.y+.5,c.z);this.ghost.visible=true;this.onHint('落点已预览，再点同一处放置。拖动仍可旋转观察。');return;}
      this.onEdit([...this.cubes,c]);
    } else {
      const hit=this.cast(e);if(!hit)return;const c=hit.object.userData.cube as Cube;
      if(this.tool==='remove' && e.pointerType==='touch' && this.pendingRemove!==key(c)){this.clearHighlight();this.pendingRemove=key(c);const mat=(hit.object as THREE.Mesh).material as THREE.MeshStandardMaterial;mat.color.set('#ee8a8e');mat.transparent=true;mat.opacity=.7;this.onHint('已选中这个方块，再点一次移除。也可以切换工具取消。');return;}
      this.onEdit(this.tool==='remove'?this.cubes.filter(old=>key(old)!==key(c)):this.cubes.map(old=>key(old)===key(c)?{...old,color:this.color}:old));
    }
  }
  view(view: View|'free'|'right'|'back'|'bottom') {
    this.clearPreview();const t=this.controls.target;
    const dirs:Record<string,THREE.Vector3>={front:new THREE.Vector3(0,0,12),left:new THREE.Vector3(-12,0,0),right:new THREE.Vector3(12,0,0),back:new THREE.Vector3(0,0,-12),top:new THREE.Vector3(0,12,.001),bottom:new THREE.Vector3(0,-12,.001),free:new THREE.Vector3(8,6,10)};
    this.camera.up.set(0,1,0);this.tween={start:performance.now(),from:this.camera.position.clone(),to:t.clone().add(dirs[view]),up:this.camera.up.clone()};
    this.controls.maxPolarAngle=Math.PI;
  }
  reset(){
    if(this.meshes.length){const box=new THREE.Box3().setFromObject(this.group);box.getCenter(this.controls.target);const radius=box.getSize(new THREE.Vector3()).length()/2;this.camera.zoom=THREE.MathUtils.clamp(Math.min(this.camera.right,this.camera.top)/(Math.max(radius,1.6)*1.55),.28,1.2);}
    else {this.controls.target.set(0,.7,-.2);this.camera.zoom=1;}
    this.camera.updateProjectionMatrix();this.view('free');
  }
  zoom(amount:number){this.camera.zoom=THREE.MathUtils.clamp(this.camera.zoom*amount,.28,3);this.camera.updateProjectionMatrix();}
  highlight(view:View, cell:string){
    this.clearHighlight();
    for(const m of this.meshes){
      const active=projected(m.userData.cube,view).join(',')===cell;
      const mat=m.material as THREE.MeshStandardMaterial;
      mat.transparent=!active;mat.opacity=active?1:.12;mat.depthWrite=active;mat.needsUpdate=true;
      const edge=(m.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial;
      edge.opacity=active?.5:.07;
      if(active){mat.color.set('#eab36f');mat.emissive.set('#a66b2d');mat.emissiveIntensity=.08;edge.color.set('#bb8a51');}
    }
  }
  clearHighlight(){for(const m of this.meshes){const mat=m.material as THREE.MeshStandardMaterial;mat.color.set(m.userData.cube.color);mat.opacity=1;mat.transparent=false;mat.depthWrite=true;mat.emissive.set(0);mat.needsUpdate=true;const edge=(m.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial;edge.opacity=.32;edge.color.set(m.userData.cube.color).multiplyScalar(.72);}}
  private animate=()=>{this.frame=requestAnimationFrame(this.animate);if(this.tween){const k=Math.min((performance.now()-this.tween.start)/600,1),ease=k*k*(3-2*k);this.camera.position.lerpVectors(this.tween.from,this.tween.to,ease);if(k===1)this.tween=undefined;}this.controls.update();this.renderer.render(this.scene,this.camera);};
}
