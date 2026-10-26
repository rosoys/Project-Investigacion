import test from 'node:test';
import assert from 'node:assert/strict';
import {solve,example} from '../src/cpm.js';
const a=(id,duration,predecessors=[])=>({id,name:id,duration,predecessors});
test('Ejemplo: 23 semanas, ruta A C D E G y holguras B=6 F=1',()=>{const r=solve(example);assert.equal(r.duration,23);assert.deepEqual(r.results.filter(a=>a.critical).map(a=>a.id),['A','C','D','E','G']);assert.equal(r.results.find(a=>a.id==='B').slack,6);assert.equal(r.results.find(a=>a.id==='F').slack,1);assert.equal(r.nodes[0].late,0);});
test('Conserva precedencias selectivas mediante actividades ficticias',()=>{const r=solve([a('A',10),a('B',2),a('C',1,['A','B']),a('E',1,['B'])]);assert.equal(r.results.find(a=>a.id==='E').early,2);assert.equal(r.results.find(a=>a.id==='C').early,10);});
test('Reconoce todas las ramas de rutas críticas múltiples',()=>{const r=solve([a('A',2),a('B',3,['A']),a('C',3,['A']),a('D',1,['B','C'])]);assert.equal(r.duration,6);assert.ok(r.results.every(a=>a.critical));assert.ok(r.edges.every(e=>e.critical));});
test('Ordena entradas desordenadas y admite decimales',()=>{const r=solve([a('B',.2,['A']),a('A',.1)]);assert.ok(Math.abs(r.duration-.3)<1e-8);assert.ok(r.results.every(a=>a.critical));});
test('Rechaza ciclos, duplicados, predecesoras desconocidas y duraciones inválidas',()=>{for(const input of [[],[a('A',1,['B']),a('B',1,['A'])],[a('A',1),a('A',2)],[a('A',1,['X'])],[a('A',0)],[a('A',NaN)]])assert.throws(()=>solve(input));});
test('Cada actividad real tiene par de eventos único y tiempos coherentes',()=>{const r=solve(example);const pairs=new Set();for(const e of r.edges){if(e.task){const key=`${e.from}:${e.to}`;assert.ok(!pairs.has(key));pairs.add(key);}assert.ok(r.nodes[e.to].early+1e-8>=r.nodes[e.from].early+e.duration);assert.ok(r.nodes[e.from].late<=r.nodes[e.to].late-e.duration+1e-8);}assert.equal(pairs.size,example.length);});

test('Una sola actividad final termina directamente en el evento final',()=>{
 const r=solve(example),finish=r.nodes.at(-1);
 assert.equal(finish.in.length,1);
 assert.equal(finish.in[0].task.id,'G');
 assert.equal(finish.out.length,0);
 assert.equal(r.nodes.length,11);
 assert.ok(r.edges.every(e=>e.to!==finish.id||e.task));
});
test('Varias actividades terminales comparten el fin sin puentes ficticios',()=>{
 const r=solve([a('A',2),a('B',3,['A']),a('C',7,['A'])]);
 const finish=r.nodes.at(-1);
 assert.deepEqual(finish.in.map(e=>e.task.id),['B','C']);
 assert.equal(r.duration,9);
 assert.equal(r.results.find(a=>a.id==='B').slack,4);
 assert.deepEqual(r.results.filter(a=>a.critical).map(a=>a.id),['A','C']);
 assert.equal(new Set(finish.in.map(e=>e.from)).size,2);
 assert.ok(r.edges.every(e=>e.from<e.to));
});
test('Actividades independientes conservan tiempos y pares de eventos distintos',()=>{
 const r=solve([a('A',3),a('B',5),a('C',5)]);
 assert.equal(r.duration,5);
 assert.deepEqual(r.results.map(a=>a.slack),[2,0,0]);
 assert.equal(r.nodes.at(-1).in.length,3);
 assert.ok(r.nodes.at(-1).in.every(e=>e.task));
 assert.equal(new Set(r.edges.map(e=>`${e.from}:${e.to}`)).size,r.edges.length);
 assert.equal(r.nodes.filter(n=>n.out.length===0).length,1);
});

test('E y F llegan al mismo evento del que sale G, sin ficticias intermedias',()=>{
 const r=solve(example),get=id=>r.edges.find(e=>e.task?.id===id);
 assert.equal(get('E').to,get('G').from);
 assert.equal(get('F').to,get('G').from);
 assert.equal(r.edges.filter(e=>!e.task).length,5);
});
test('Simplificación conserva dependencias y todos los tiempos en redes variadas',()=>{
 let seed=2467;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(let run=0;run<40;run++){
  const activities=[];
  for(let i=0;i<10;i++)activities.push(a(`T${i}`,1+Math.floor(random()*9),activities.filter(()=>random()<.3).map(t=>t.id)));
  const r=solve(activities),early={},late={};
  for(const task of activities)early[task.id]=Math.max(0,...task.predecessors.map(p=>early[p]+activities.find(t=>t.id===p).duration));
  const duration=Math.max(...activities.map(t=>early[t.id]+t.duration));
  for(const task of [...activities].reverse()){
   const successors=activities.filter(t=>t.predecessors.includes(task.id));
   late[task.id]=(successors.length?Math.min(...successors.map(t=>late[t.id])):duration)-task.duration;
  }
  assert.equal(r.duration,duration);
  for(const result of r.results){
   assert.equal(result.early,early[result.id]);assert.equal(result.late,late[result.id]);
   assert.equal(result.slack,late[result.id]-early[result.id]);
  }
  const reaches=(from,to)=>{
   if(from===to)return true;
   const visited=new Set([from]),pending=[from];
   while(pending.length){const node=pending.pop();for(const e of r.edges.filter(e=>e.from===node)){if(e.to===to)return true;if(!visited.has(e.to)){visited.add(e.to);pending.push(e.to);}}}
   return false;
  };
  const ancestors={};for(const task of activities)ancestors[task.id]=new Set(task.predecessors.flatMap(p=>[p,...ancestors[p]]));
  for(const first of activities)for(const second of activities){
   if(first===second)continue;
   const source=r.edges.find(e=>e.task?.id===first.id),target=r.edges.find(e=>e.task?.id===second.id);
   assert.equal(reaches(source.to,target.from),ancestors[second.id].has(first.id));
  }
  assert.equal(new Set(r.edges.map(e=>`${e.from}:${e.to}`)).size,r.edges.length);
  assert.ok(r.edges.every(e=>e.from<e.to));
 }
});


test('Se conservan las ficticias de arranque y las bifurcaciones didácticas',()=>{
 const r=solve(example),get=id=>r.edges.find(e=>e.task?.id===id);
 const ficticia=(from,to)=>r.edges.some(e=>!e.task&&e.from===from&&e.to===to);
 assert.ok(ficticia(0,get('A').from));
 for(const [predecessor,successor] of [['A','B'],['A','C'],['D','E'],['D','F']]){
  assert.notEqual(get(predecessor).to,get(successor).from);
  assert.ok(ficticia(get(predecessor).to,get(successor).from));
 }
 assert.equal(get('E').to,get('G').from);
 assert.equal(get('F').to,get('G').from);
});
test('Las ficticias iniciales de varias actividades independientes permanecen visibles',()=>{
 const r=solve([a('A',2),a('B',3),a('C',1,['A'])]);
 for(const id of ['A','B']){
  const task=r.edges.find(e=>e.task?.id===id);
  assert.ok(r.edges.some(e=>!e.task&&e.from===0&&e.to===task.from));
 }
});


test('La unión de predecesoras se aplica a una actividad intermedia con cualquier nombre',()=>{
 const r=solve([a('Diseño',2),a('Compra',5),a('Ensamble',3,['Diseño','Compra']),a('Pruebas',1,['Ensamble'])]);
 const get=id=>r.edges.find(e=>e.task?.id===id);
 assert.equal(get('Diseño').to,get('Ensamble').from);
 assert.equal(get('Compra').to,get('Ensamble').from);
 assert.equal(get('Ensamble').to,get('Pruebas').from);
 assert.equal(r.duration,9);
});
test('Regla del PDF: C espera A y B, E espera solo B; conserva ficticia selectiva',()=>{
 const r=solve([a('A',10),a('B',2),a('C',1,['A','B']),a('E',1,['B'])]);
 const get=id=>r.edges.find(e=>e.task?.id===id);
 assert.equal(get('A').to,get('C').from);
 assert.ok(r.edges.some(e=>!e.task&&e.from===get('B').to&&e.to===get('E').from));
 assert.notEqual(get('B').to,get('C').from);
 assert.ok(r.edges.some(e=>!e.task&&e.from===get('B').to&&e.to===get('C').from));
 assert.equal(r.results.find(a=>a.id==='E').early,2);
 assert.equal(r.results.find(a=>a.id==='C').early,10);
});
test('Una sola predecesora puede unirse a su sucesora sin eliminar la ficticia inicial',()=>{
 const r=solve([a('Preparar',2),a('Ejecutar',4,['Preparar'])]);
 const first=r.edges.find(e=>e.task?.id==='Preparar'),second=r.edges.find(e=>e.task?.id==='Ejecutar');
 assert.equal(first.to,second.from);
 assert.equal(r.edges.filter(e=>!e.task).length,1);
 assert.equal(r.edges.find(e=>!e.task).from,0);
});

test('Responsables se conservan en resultados sin cambiar los cálculos',()=>{
 const r=solve([{...a('A',2),responsible:'  Ana María López  '},a('B',3,['A'])]);
 assert.equal(r.results[0].responsible,'Ana María López');
 assert.equal(r.results[1].responsible,'');
 assert.equal(r.duration,5);
 assert.ok(r.results.every(a=>a.critical));
});
