export const dayNames = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
export const defaultCalendar = {basis:'working',workDays:[0,1,2,3,4],hoursPerDay:8,startTime:'08:00'};
export function validateCalendar(calendar) {
 if(!calendar || !['working','calendar'].includes(calendar.basis)) throw Error('Selecciona tiempo hábil o natural.');
 if(!Array.isArray(calendar.workDays)||calendar.workDays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(calendar.workDays).size!==calendar.workDays.length||(calendar.basis==='working'&&!calendar.workDays.length)) throw Error('Selecciona al menos un día hábil de la semana.');
 if(!['number','string'].includes(typeof calendar.hoursPerDay)||(typeof calendar.hoursPerDay==='string'&&!/^\d+(?:\.\d*)?$/.test(calendar.hoursPerDay)))throw Error('Las horas por día deben contener solo números.');
 const hours=Number(calendar.hoursPerDay);
 if(!Number.isFinite(hours)||hours<=0||hours>24||!Number.isInteger(hours*60)) throw Error('La jornada debe durar entre 1 minuto y 24 horas, en minutos completos.');
 if(typeof calendar.startTime!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(calendar.startTime)) throw Error('Indica una hora válida de inicio de jornada.');
 return {...calendar,hoursPerDay:hours};
}
export function calendarDetails(input) {
 const c=validateCalendar(input);
 const days=c.basis==='working'?c.workDays.length:7;
 const [h,m]=c.startTime.split(':').map(Number);
 const end=h*60+m+Math.round(c.hoursPerDay*60);
 const endTime=`${String(Math.floor(end/60)%24).padStart(2,'0')}:${String(end%60).padStart(2,'0')}${end>=1440?' (+1 día)':''}`;
 return {...c,daysPerWeek:days,hoursPerWeek:days*c.hoursPerDay,endTime};
}
export function calendarSummary(input) {
 try {
  const c=calendarDetails(input);
  const days=c.basis==='working'?[...c.workDays].sort((a,b)=>a-b).map(d=>dayNames[d]).join(', '):'lunes a domingo';
  return `${c.basis==='working'?'Tiempo hábil':'Tiempo natural'} · ${days} · ${c.hoursPerDay} h/día · ${c.hoursPerWeek} h/semana · Jornada ${formatTime12(c.startTime)}–${formatTime12(c.endTime)}`;
 } catch {return 'Completa la configuración de la jornada laboral.';}
}
export function executionEquivalent(duration,unit,input) {
 const c=calendarDetails(input);
 if(unit==='semanas')return `${Number((duration*c.daysPerWeek).toFixed(4))} días ${c.basis==='working'?'hábiles':'naturales'} · ${Number((duration*c.hoursPerWeek).toFixed(4))} horas de jornada`;
 if(unit==='días')return `${Number((duration*c.hoursPerDay).toFixed(4))} horas de jornada`;
 return '';
}

export function normalizeCalendar(input={}) {
 const c={...defaultCalendar,...input};
 const standard=c.basis==='working'&&c.workDays.length===5&&[0,1,2,3,4].every(d=>c.workDays.includes(d));
 return {...c,preset:input.preset??(standard?'standard':'custom')};
}
export const isDecimalInput = value => /^\d*(?:[.,]\d*)?$/.test(value);
const dayMs=86400000;
function parseDate(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Indica una fecha de inicio válida.');
 const date=new Date(`${value}T00:00:00Z`);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)throw Error('Indica una fecha de inicio válida.');
 return date;
}
export function validateStartDate(value) { if(value)parseDate(value); }
const dateString=date=>date.toISOString().slice(0,10);
export function estimateDelivery(startDate,duration,unit,input) {
 if(!startDate)return null;
 const c=calendarDetails(input),requested=parseDate(startDate);
 if(!Number.isFinite(duration)||duration<=0)throw Error('La duración del proyecto debe ser positiva.');
 const isWorkday=date=>c.basis==='calendar'||c.workDays.includes((date.getUTCDay()+6)%7);
 const align=date=>{if(!Number.isFinite(date.getTime()))throw Error('La duración excede el rango de fechas admitido.');while(!isWorkday(date))date.setUTCDate(date.getUTCDate()+1);return date;};
 const [hour,minute]=c.startTime.split(':').map(Number);
 const actualStart=align(new Date(requested));
 const shiftMinutes=Math.round(c.hoursPerDay*60);
 let end;
 if(unit==='meses'){
  // Mes calendario: mismo día del mes, limitado al último día disponible.
  const addMonths=(date,count)=>{
   const next=new Date(date);next.setUTCDate(1);next.setUTCMonth(next.getUTCMonth()+count);
   const last=new Date(next);last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
   next.setUTCDate(Math.min(date.getUTCDate(),last.getUTCDate()));return next;
  };
  const whole=Math.floor(duration),fraction=duration-whole;
  end=addMonths(actualStart,whole);
  if(fraction){const next=addMonths(actualStart,whole+1);end=new Date(end.getTime()+Math.ceil((next-end)/dayMs*fraction)*dayMs);}
  align(end);end.setUTCMinutes(hour*60+minute);
 }else{
  const minutes=unit==='semanas'?duration*c.daysPerWeek*shiftMinutes:unit==='días'?duration*shiftMinutes:unit==='horas'?duration*60:NaN;
  if(!Number.isFinite(minutes))throw Error('Unidad de tiempo no reconocida.');
  // Terminar justo al cierre conserva ese día; no pasa al inicio del siguiente.
  let remaining=Math.ceil(minutes-1e-8),day=new Date(actualStart);
  const fullWeeks=Math.max(0,Math.floor((remaining-1)/(c.daysPerWeek*shiftMinutes)));
  if(fullWeeks){day.setUTCDate(day.getUTCDate()+fullWeeks*7);remaining-=fullWeeks*c.daysPerWeek*shiftMinutes;}
  if(!Number.isFinite(day.getTime()))throw Error('La duración excede el rango de fechas admitido.');
  while(remaining>shiftMinutes){remaining-=shiftMinutes;day.setUTCDate(day.getUTCDate()+1);align(day);}
  end=new Date(day);end.setUTCMinutes(hour*60+minute+remaining);
 }
 if(!Number.isFinite(end.getTime())||end.getUTCFullYear()>9999)throw Error('La entrega estimada excede el año 9999.');
 const time=date=>`${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`;
 return {requestedStart:startDate,actualStart:dateString(actualStart),startTime:c.startTime,date:dateString(end),time:time(end),shifted:dateString(actualStart)!==startDate,months:unit==='meses'};
}
export function formatDate(value) {
 if(!value)return 'Sin definir';
 return new Intl.DateTimeFormat('es-GT',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(parseDate(value));
}

export function timeTo12(time) {
 const [hour,minute]=time.split(':').map(Number);
 return {hour:String(hour%12||12),minute:String(minute).padStart(2,'0'),period:hour>=12?'PM':'AM'};
}
export function timeFrom12({hour,minute,period}) {
 return `${String(Number(hour)%12+(period==='PM'?12:0)).padStart(2,'0')}:${minute}`;
}
export function formatTime12(time) {
 const parts=timeTo12(time.slice(0,5));
 return `${parts.hour}:${parts.minute} ${parts.period}${time.slice(5)}`;
}
