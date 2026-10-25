/* Estadísticas simuladas con cambios deterministas según las decisiones. */
window.FunnelStats = (() => {
  const KEY = "funnelMasterStateV1";
  const initial = () => ({visitors:1000,leads:300,interested:150,buyers:30,loyal:12,trust:50,loyalty:40,revenue:3000000,xp:0,correct:0,answered:0,streak:0,badges:[],completedModes:[]});
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || initial(); } catch (_) { state = initial(); }
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const safe = () => {
    ["visitors","leads","interested","buyers","loyal"].forEach(k=>state[k]=Math.max(0,Math.floor(Number(state[k])||0)));
    state.leads=Math.min(state.leads,state.visitors); state.interested=Math.min(state.interested,state.leads);
    state.buyers=Math.min(state.buyers,state.interested); state.loyal=Math.min(state.loyal,state.buyers);
    state.trust=clamp(Number(state.trust)||0,0,100); state.loyalty=clamp(Number(state.loyalty)||0,0,100);
    state.xp=Math.max(0,Math.floor(Number(state.xp)||0)); state.revenue=Math.max(0,Math.floor(Number(state.revenue)||0));
  };
  const applyEffect = e => {
    Object.keys(e||{}).forEach(k=>{ if(k in state) state[k]+=Number(e[k])||0; });
    safe(); save();
  };
  const award = (isCorrect, points=10) => {
    state.answered++; if(isCorrect){state.correct++;state.streak++;state.xp+=points+(state.streak>=3?5:0);} else state.streak=0;
    safe(); save(); return state.xp;
  };
  const addBadge = name => { if(!state.badges.includes(name))state.badges.push(name);save(); };
  const completeMode = name => {if(!state.completedModes.includes(name))state.completedModes.push(name);save();};
  const reset = () => {state=initial();save();};
  const conversion = () => state.visitors ? state.buyers/state.visitors*100 : 0;
  const rank = () => state.xp>=250?"LEYENDA DEL MARKETING":state.xp>=170?"MAESTRO DEL EMBUDO":state.xp>=100?"ESPECIALISTA EN CONVERSIÓN":state.xp>=40?"ESTRATEGA DIGITAL":"APRENDIZ DEL MARKETING";
  return {get state(){return {...state,badges:[...state.badges],completedModes:[...state.completedModes]};},applyEffect,award,addBadge,completeMode,reset,conversion,rank,save};
})();
