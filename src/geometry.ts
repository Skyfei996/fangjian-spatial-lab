export type View = 'front' | 'left' | 'top';
export type Cube = { x: number; y: number; z: number; color: string };
export const COLORS = ['#8392ed', '#68bda6', '#edb576', '#df91ad', '#82b9db'];
export const key = (c: Pick<Cube, 'x' | 'y' | 'z'>) => `${c.x},${c.y},${c.z}`;
export const clone = (cubes: Cube[]) => cubes.map(c => ({ ...c }));
export const bounded = (c: Cube) => Number.isInteger(c.x) && Number.isInteger(c.y) && Number.isInteger(c.z) && Math.abs(c.x) <= 4 && Math.abs(c.z) <= 4 && c.y >= 0 && c.y < 7;
export function validScene(value: unknown): value is Cube[] {
  return Array.isArray(value) && value.length <= 300 && value.every(c => c && bounded(c) && typeof c.color === 'string' && /^#[0-9a-f]{6}$/i.test(c.color)) && new Set(value.map(key)).size === value.length;
}
export function projected(c: Cube, view: View): [number, number] {
  if (view === 'front') return [c.x, c.y];
  if (view === 'left') return [c.z, c.y];
  return [c.x, -c.z];
}
export function project(cubes: Cube[], view: View): Set<string> {
  return new Set(cubes.map(c => projected(c, view).join(',')));
}
export const equal = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(k => b.has(k));
export function checkAddition(base: Cube[], answer: Cube[], view: View) {
  const before = new Set(base.map(key)), after = new Set(answer.map(key));
  if (answer.length !== base.length + 1 || after.size !== before.size + 1 || ![...before].every(k => after.has(k))) return { correct: false, reason: '保留原来的方块，只增加一个新方块，再试一次。' };
  if (!equal(project(base, view), project(answer, view))) return { correct: false, reason: '这个位置改变了左视图。试着把新方块放到从左面看会重叠的位置。' };
  return { correct: true, reason: '答对了！新方块与原有方块投到了同一个格子里，所以左视图保持不变。' };
}
export const PRESETS: { name: string; note: string; cubes: Cube[] }[] = [
  { name: '阶梯小屋', note: '从不同方向发现变化', cubes: [[-1,0,0],[0,0,0],[1,0,0],[-1,0,-1],[0,0,-1],[1,0,-1],[0,1,-1]].map(([x,y,z]) => ({ x,y,z,color: COLORS[0] })) },
  { name: '转角积木', note: '四个方块的小秘密', cubes: [[0,0,0],[1,0,0],[0,0,-1],[0,1,-1]].map(([x,y,z]) => ({ x,y,z,color: COLORS[1] })) },
  { name: '小小拱门', note: '看看空洞会出现在哪', cubes: [[-1,0,0],[-1,1,0],[-1,2,0],[0,2,0],[1,2,0],[1,1,0],[1,0,0]].map(([x,y,z]) => ({ x,y,z,color: COLORS[2] })) }
];
