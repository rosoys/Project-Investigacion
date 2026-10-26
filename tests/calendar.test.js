import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultCalendar,calendarDetails,calendarSummary,executionEquivalent,validateCalendar} from '../src/calendar.js';

test('Semana hábil de cinco días: jornada y equivalencia de 23 semanas',()=>{
 const c=calendarDetails(defaultCalendar);
 assert.equal(c.daysPerWeek,5);
 assert.equal(c.hoursPerWeek,40);
 assert.equal(c.endTime,'16:00');
 assert.equal(executionEquivalent(23,'semanas',defaultCalendar),'115 días hábiles · 920 horas de jornada');
});
test('Semana natural usa siete días y jornadas nocturnas indican cambio de día',()=>{
 const c={...defaultCalendar,basis:'calendar',hoursPerDay:8,startTime:'22:30'};
 assert.equal(calendarDetails(c).hoursPerWeek,56);
 assert.equal(calendarDetails(c).endTime,'06:30 (+1 día)');
 assert.match(calendarSummary(c),/Tiempo natural · lunes a domingo/);
});
test('Días laborales personalizados y duración fraccionaria',()=>{
 const c={...defaultCalendar,workDays:[0,2,4],hoursPerDay:7.5,startTime:'07:15'};
 assert.equal(calendarDetails(c).endTime,'14:45');
 assert.equal(calendarDetails(c).hoursPerWeek,22.5);
 assert.equal(executionEquivalent(2,'días',c),'15 horas de jornada');
 assert.equal(executionEquivalent(2,'meses',c),'');
});
test('Rechaza horarios y jornadas inválidas sin aceptar cero días hábiles',()=>{
 for(const c of [null,{...defaultCalendar,workDays:[]},{...defaultCalendar,workDays:[0,0]},{...defaultCalendar,hoursPerDay:''},{...defaultCalendar,hoursPerDay:25},{...defaultCalendar,startTime:'25:00'},{...defaultCalendar,hoursPerDay:0.001}])assert.throws(()=>validateCalendar(c));
 assert.equal(calendarSummary({...defaultCalendar,workDays:[]}),'Completa la configuración de la jornada laboral.');
});

import {estimateDelivery,isDecimalInput,normalizeCalendar,validateStartDate} from '../src/calendar.js';
test('La semana estándar termina el viernes al cierre de jornada',()=>{
 const result=estimateDelivery('2026-10-26',1,'semanas',defaultCalendar);
 assert.equal(result.date,'2026-10-30');assert.equal(result.time,'16:00');
 assert.equal(estimateDelivery('2026-10-26',2,'semanas',defaultCalendar).date,'2026-11-06');
});
test('Inicio en fin de semana se ajusta al lunes; duración parcial respeta horario',()=>{
 const result=estimateDelivery('2026-10-25',2,'horas',defaultCalendar);
 assert.equal(result.actualStart,'2026-10-26');assert.equal(result.shifted,true);
 assert.equal(result.date,'2026-10-26');assert.equal(result.time,'10:00');
 const next=estimateDelivery('2026-10-30',1.5,'días',defaultCalendar);
 assert.equal(next.date,'2026-11-02');assert.equal(next.time,'12:00');
});
test('Días naturales y días personalizados gobiernan la entrega',()=>{
 const natural=estimateDelivery('2026-10-26',1,'semanas',{...defaultCalendar,basis:'calendar'});
 assert.equal(natural.date,'2026-11-01');assert.equal(natural.time,'16:00');
 const custom=estimateDelivery('2026-10-26',2,'días',{...defaultCalendar,workDays:[0,2,4]});
 assert.equal(custom.date,'2026-10-28');
});
test('Cierre nocturno y meses calendario con último día válido',()=>{
 const night=estimateDelivery('2026-10-30',8,'horas',{...defaultCalendar,startTime:'22:00'});
 assert.equal(night.date,'2026-10-31');assert.equal(night.time,'06:00');
 const month=estimateDelivery('2028-01-31',1,'meses',{...defaultCalendar,basis:'calendar'});
 assert.equal(month.date,'2028-02-29');
 assert.equal(estimateDelivery('',1,'días',defaultCalendar),null);
 assert.throws(()=>validateStartDate('2026-02-30'));
});
test('Entrada de horas admite decimales y rechaza letras, exponentes y signos',()=>{
 for(const value of ['8','7.5','7,5',''])assert.ok(isDecimalInput(value));
 for(const value of ['e','1e2','-8','ocho','8h','2.3.4'])assert.ok(!isDecimalInput(value));
 assert.throws(()=>validateCalendar({...defaultCalendar,hoursPerDay:'1e1'}));
 assert.equal(normalizeCalendar().preset,'standard');
 assert.equal(normalizeCalendar({...defaultCalendar,workDays:[0,1,2,3,4,5]}).preset,'custom');
});

import {timeTo12,timeFrom12,formatTime12} from '../src/calendar.js';
test('Conversión AM/PM conserva medianoche, mediodía y minutos',()=>{
 for(const time of ['00:00','00:30','08:15','12:00','12:45','23:59'])assert.equal(timeFrom12(timeTo12(time)),time);
 assert.deepEqual(timeTo12('00:00'),{hour:'12',minute:'00',period:'AM'});
 assert.deepEqual(timeTo12('12:00'),{hour:'12',minute:'00',period:'PM'});
 assert.equal(formatTime12('16:30'),'4:30 PM');
 assert.equal(formatTime12('06:00 (+1 día)'),'6:00 AM (+1 día)');
});
