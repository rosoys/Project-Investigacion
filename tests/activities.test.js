import test from 'node:test';
import assert from 'node:assert/strict';
import {activityId,assignAutomaticIds,nextActivityId} from '../src/activities.js';

test('Los identificadores continúan después de Z sin repetirse',()=>{
 assert.deepEqual([0,25,26,27,51,52,99].map(activityId),['A','Z','AA','AB','AZ','BA','CV']);
});
test('Cambiar de manual a automático conserva las dependencias',()=>{
 const activities=[{id:'Diseño',predecessors:[]},{id:'Construcción',predecessors:['Diseño']},{id:'Entrega',predecessors:['Diseño','Construcción']}];
 const result=assignAutomaticIds(activities);
 assert.deepEqual(result.map(a=>a.id),['A','B','C']);
 assert.deepEqual(result[2].predecessors,['A','B']);
 assert.equal(activities[0].id,'Diseño');
});
test('Al agregar actividades se evitan identificadores existentes',()=>{
 assert.equal(nextActivityId([{id:'A'},{id:'B'}]),'C');
 assert.equal(nextActivityId([{id:'A'},{id:'C'}]),'B');
 assert.equal(nextActivityId(Array.from({length:26},(_,i)=>({id:activityId(i)}))),'AA');
});
