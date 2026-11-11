import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, COLORS, project, equal, checkAddition, validScene, projected, type Cube } from '../src/geometry.ts';

const cube=(x:number,y:number,z:number):Cube=>({x,y,z,color:COLORS[0]});
test('前后重叠只占一个正面格子，俯视图保留深度',()=>{
  const cubes=[cube(0,0,0),cube(0,0,-1),cube(1,0,0),cube(0,1,-1)];
  assert.deepEqual(project(cubes,'front'),new Set(['0,0','1,0','0,1']));
  assert.deepEqual(project(cubes,'top'),new Set(['0,0','0,1','1,0']));
});
test('左视图从左向右显示后到前，俯视图上方为后方',()=>{
  assert.deepEqual(projected(cube(3,2,-1),'left'),[-1,2]);
  assert.deepEqual(projected(cube(3,2,-1),'top'),[3,1]);
});
test('拱门的洞在正面保留，不能只通过最大高度生成投影',()=>{
  const cells=project(PRESETS[2].cubes,'front');
  assert.equal(cells.has('0,0'),false);assert.equal(cells.has('0,1'),false);assert.equal(cells.has('0,2'),true);
});
test('空模型产生空投影',()=>assert.equal(project([],'front').size,0));
test('新增被遮挡的一块保持左视图不变',()=>{
  const base=PRESETS[1].cubes;
  assert.equal(checkAddition(base,[...base,cube(1,0,-1)],'left').correct,true);
});
test('数量正确但改变左视图的放法必须失败',()=>{
  const base=PRESETS[1].cubes;
  assert.equal(checkAddition(base,[...base,cube(0,0,1)],'left').correct,false);
});
test('原模型被移走一块，再增加两块，不满足只加一块',()=>{
  const base=PRESETS[1].cubes;
  assert.equal(checkAddition(base,[...base.slice(1),cube(2,0,0),cube(3,0,0)],'left').correct,false);
});
test('没有增加方块时不能通过判题',()=>assert.equal(checkAddition(PRESETS[1].cubes,PRESETS[1].cubes,'left').correct,false));
test('重复记录已有方块不能冒充新增方块',()=>{
  const base=PRESETS[1].cubes;
  assert.equal(checkAddition(base,[...base,{...base[0]}],'left').correct,false);
});
test('校验拒绝重复、非法坐标、越界和非法颜色',()=>{
  assert.equal(validScene([]),true);assert.equal(validScene(PRESETS[0].cubes),true);
  for(const value of [[cube(0,0,0),cube(0,0,0)],[cube(.5,0,0)],[cube(0,-1,0)],[cube(5,0,0)],[cube(0,7,0)],[{...cube(0,0,0),color:'red'}],null,[null]])assert.equal(validScene(value),false);
});
test('相同格子数但位置不同不能通过视图匹配',()=>assert.equal(equal(new Set(['0,0']),new Set(['1,0'])),false));
