// A…Z, AA…AZ, BA…: identificadores sin límite de una sola letra.
export function activityId(index) {
 let value = index + 1, label = '';
 while (value > 0) {
  value--;
  label = String.fromCharCode(65 + value % 26) + label;
  value = Math.floor(value / 26);
 }
 return label;
}
export function assignAutomaticIds(activities) {
 const renamed = new Map(activities.filter(a => a.id).map(a => [a.id, activityId(activities.indexOf(a))]));
 return activities.map((a, index) => ({...a, id: activityId(index), predecessors: a.predecessors.map(id => renamed.get(id) ?? id)}));
}
export function nextActivityId(activities) {
 const used = new Set(activities.map(a => a.id));
 let index = 0;
 while (used.has(activityId(index))) index++;
 return activityId(index);
}
