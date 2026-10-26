export const example = [
 ['A','Definición del sistema',3,[]],['B','Diseño de interfaces',3,['A']],['C','Desarrollo del sistema',7,['A']],['D','Integración de componentes',2,['C']],['E','Validación funcional',4,['B','D']],['F','Documentación técnica',3,['D']],['G','Implementación final',7,['E','F']],
].map(([id,name,duration,predecessors])=>({id,name,duration,predecessors}));
const near = n => Math.abs(n)<1e-8;
export const fmt = n => Number(n.toFixed(4)).toString();
// Regla general: el final de una actividad puede coincidir con el evento de
// su sucesora si su única salida es esa ficticia. La unión no debe introducir
// lazos ni pares de eventos repetidos. Se conservan las ficticias de arranque
// (desde el evento 0) para el seguimiento didáctico solicitado.
function simplifyNetwork(nodes,edges,map){
 let changed=true;
 while(changed){
  changed=false;
  for(const candidate of edges){
   if(candidate.task||candidate.from===0)continue;
   const exclusiveOut=edges.filter(e=>e.from===candidate.from).length===1;
   if(!exclusiveOut)continue;
   const merge=id=>id===candidate.to?candidate.from:id;
   const remaining=edges.filter(e=>e!==candidate);
   const pairs=new Set();
   const valid=remaining.every(e=>{
    const from=merge(e.from),to=merge(e.to),pair=`${from}:${to}`;
    if(from===to||pairs.has(pair))return false;
    pairs.add(pair);return true;
   });
   if(!valid)continue;
   edges.splice(edges.indexOf(candidate),1);
   for(const e of edges){e.from=merge(e.from);e.to=merge(e.to);}
   changed=true;break;
  }
 }
 // Numerar nuevamente de inicio a fin para mantener los recorridos en orden.
 const eventIds=[...new Set(edges.flatMap(e=>[e.from,e.to]))].sort((a,b)=>a-b);
 const ordered=[];
 while(ordered.length<eventIds.length){
  const next=eventIds.find(id=>!ordered.includes(id)&&edges.filter(e=>e.to===id).every(e=>ordered.includes(e.from)));
  if(next===undefined)throw Error('No se pudo ordenar la red de eventos.');
  ordered.push(next);
 }
 const number=new Map(ordered.map((id,index)=>[id,index]));
 nodes.splice(0,nodes.length,...ordered.map((_,id)=>({id})));
 edges.forEach((e,id)=>{e.id=id;e.from=number.get(e.from);e.to=number.get(e.to);if(e.task)map[e.task.id]={from:e.from,to:e.to};});
}
export function solve(input){
 if(!Array.isArray(input)||!input.length) throw Error('Agrega al menos una actividad.');
 if(input.length>100) throw Error('Esta versión admite hasta 100 actividades.');
 const tasks=input.map(a=>({id:String(a.id??'').trim(),name:String(a.name??'').trim(),responsible:String(a.responsible??'').trim(),duration:Number(a.duration),predecessors:Array.isArray(a.predecessors)?[...new Set(a.predecessors)]:[]}));
 const ids=new Set();
 for(const a of tasks){if(!a.id||!a.name)throw Error('Cada actividad necesita identificador y nombre.');if(ids.has(a.id))throw Error(`Identificador repetido: ${a.id}.`);ids.add(a.id);if(a.duration===''||!Number.isFinite(a.duration)||a.duration<=0)throw Error(`La duración de ${a.id} debe ser mayor que cero.`);}
 for(const a of tasks)for(const p of a.predecessors)if(!ids.has(p)||p===a.id)throw Error(`Predecesora inválida en ${a.id}: ${p}.`);
 const ordered=[],pending=[...tasks];
 while(pending.length){const i=pending.findIndex(a=>a.predecessors.every(p=>ordered.some(b=>b.id===p)));if(i<0)throw Error('Las dependencias contienen un ciclo. Revisa las predecesoras.');ordered.push(...pending.splice(i,1));}
 const nodes=[{id:0}],edges=[],map={};
 const node=()=>{const id=nodes.length;nodes.push({id});return id;};
 const edge=(from,to,duration,task=null)=>edges.push({id:edges.length,from,to,duration,task});
 // Las actividades terminales desembocan directamente en un único evento final.
 // Cada una mantiene un origen propio para conservar pares (origen, destino) únicos.
 const hasSuccessors=new Set(tasks.flatMap(a=>a.predecessors));
 for(const a of ordered){const from=node(),to=hasSuccessors.has(a.id)?node():null;map[a.id]={from,to};edge(from,to,a.duration,a);for(const p of a.predecessors)edge(map[p].to,from,0);if(!a.predecessors.length)edge(0,from,0);}
 const finish=node();
 for(const a of ordered)if(map[a.id].to===null)map[a.id].to=finish;
 for(const e of edges)if(e.to===null)e.to=finish;
 simplifyNetwork(nodes,edges,map);
 const steps=[];
 for(const n of nodes){n.in=edges.filter(e=>e.to===n.id);n.out=edges.filter(e=>e.from===n.id);n.early=n.in.length?Math.max(...n.in.map(e=>nodes[e.from].early+e.duration)):0;n.rank=n.in.length?Math.max(...n.in.map(e=>nodes[e.from].rank+1)):0;
 steps.push({phase:'forward',node:n.id,title:`Ida · Evento ${n.id+1}`,formula:n.in.length?`máx(${n.in.map(e=>`${fmt(nodes[e.from].early)} + ${fmt(e.duration)}`).join('; ')}) = ${fmt(n.early)}`:'Inicio del proyecto: 0',edges:n.in.map(e=>e.id)});}
 const duration=nodes.at(-1).early;
 for(const n of [...nodes].reverse()){n.late=n.out.length?Math.min(...n.out.map(e=>nodes[e.to].late-e.duration)):duration;steps.push({phase:'backward',node:n.id,title:`Regreso · Evento ${n.id+1}`,formula:n.out.length?`mín(${n.out.map(e=>`${fmt(nodes[e.to].late)} − ${fmt(e.duration)}`).join('; ')}) = ${fmt(n.late)}`:`Fin del proyecto: ${fmt(duration)}`,edges:n.out.map(e=>e.id)});}
 for(const e of edges){e.critical=near(nodes[e.to].late-nodes[e.from].early-e.duration);}
 const results=ordered.map(a=>{const {from,to}=map[a.id];const early=nodes[from].early,late=nodes[to].late-a.duration;return {...a,early,earlyFinish:early+a.duration,late,lateFinish:nodes[to].late,slack:late-early,critical:near(late-early)};});
 for(const n of nodes){const critical=n.out.filter(e=>e.critical);if(critical.length)steps.push({phase:'critical',node:n.id,title:`Ruta crítica · Evento ${n.id+1}`,formula:'Resaltamos las conexiones con holgura total cero.',edges:critical.map(e=>e.id)});}
 steps.push({phase:'done',title:'Análisis completado',formula:`Duración total: ${fmt(duration)}. Las actividades resaltadas tienen holgura total cero.`,edges:[]});
 return {nodes,edges,results,duration,steps};
}
