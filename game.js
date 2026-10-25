/* Control de pantallas, modos de juego, puntuación y feedback. */
(() => {
  const $ = s => document.querySelector(s);
  const screens = ["homeScreen","tutorialScreen","gameScreen","resultsScreen"];
  let currentMode=null, queue=[], index=0, modeCorrect=0, modeAnswered=0, timerId=null, seconds=30, selectedCampaign={};
  const modeNames={build:"Construye tu embudo",save:"Salva la empresa",mystery:"Cliente misterioso",race:"Carrera contra el tiempo",campaign:"Crea tu propia campaña"};
  const modeDescriptions={build:"Relaciona cada estrategia con la etapa adecuada.",save:"Analiza la situación y elige la decisión con mayor impacto.",mystery:"Identifica qué necesita cada tipo de cliente.",race:"Responde correctamente antes de que termine el tiempo.",campaign:"Diseña una estrategia coherente de principio a fin."};
  function showScreen(id){screens.forEach(s=>$("#"+s).classList.toggle("active",s===id));window.scrollTo({top:0,behavior:"smooth"});}
  function fmt(n){return Math.round(n).toLocaleString("es-CO");}
  function updateDashboard(){
    const s=FunnelStats.state;
    $("#levelTop").textContent=String(Math.floor(s.xp/50)+1).padStart(2,"0");$("#xpTop").textContent=s.xp;
    $("#visitorsMetric").textContent=fmt(s.visitors);$("#leadsMetric").textContent=fmt(s.leads);$("#buyersMetric").textContent=fmt(s.buyers);
    $("#conversionMetric").textContent=FunnelStats.conversion().toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+"%";
    $("#trustLabel").textContent=s.trust+"/100";$("#trustBar").style.width=s.trust+"%";
    $("#loyaltyLabel").textContent=s.loyalty+"/100";$("#loyaltyBar").style.width=s.loyalty+"%";
    $("#revenueMetric").textContent="$"+fmt(s.revenue);$("#gameXP").textContent=s.xp;
  }
  function stopTimer(){if(timerId){clearInterval(timerId);timerId=null;}}
  function startMode(mode){
    stopTimer();currentMode=mode;index=0;modeCorrect=0;modeAnswered=0;queue=[];
    $("#gameEyebrow").textContent="MODO "+String(["build","save","mystery","race","campaign"].indexOf(mode)+1).padStart(2,"0");
    $("#gameTitle").textContent=modeNames[mode];$("#gameSubtitle").textContent=modeDescriptions[mode];
    $("#feedback").hidden=true;$("#continueBtn").hidden=true;$("#timerPill").hidden=mode!=="race";
    if(mode==="build")queue=[...FUNNEL_CHALLENGES.build].sort(()=>Math.random()-.5);
    if(mode==="save")queue=[...FUNNEL_CHALLENGES.save];
    if(mode==="mystery")queue=[...FUNNEL_CHALLENGES.mystery];
    if(mode==="race")queue=[...FUNNEL_CHALLENGES.race].sort(()=>Math.random()-.5);
    showScreen("gameScreen");renderCurrent();
  }
  function challengeShell(kicker,title,body){return `<article class="challenge-card"><div class="challenge-top"><span class="tag">${kicker}</span><span class="muted">${Math.min(index+1,queue.length)} / ${queue.length}</span></div><h2>${title}</h2><p>${body}</p><div class="progress" style="margin-top:18px"><span style="width:${Math.min(100,index/Math.max(queue.length,1)*100)}%"></span></div></article>`;}
  function renderCurrent(){
    stopTimer();$("#feedback").hidden=true;$("#continueBtn").hidden=true;$("#gameXP").textContent=FunnelStats.state.xp;
    if(currentMode==="campaign"){renderCampaign();return;}
    if(index>=queue.length){finishMode();return;}
    const c=queue[index];let html="";
    if(currentMode==="build"){
      html=challengeShell("CLASIFICA LA ESTRATEGIA", "¿En qué etapa encaja mejor?", c.strategy)+`<div class="stage-select">${FUNNEL_STAGES.map((s,i)=>`<button class="stage-btn" data-stage="${i}"><b>0${i+1}</b>${s}</button>`).join("")}</div>`;
    } else {
      const title=c.title||c.question;
      html=challengeShell(currentMode==="race"?"RETO CONTRARRELOJ":currentMode==="mystery"?"PERFIL DE CLIENTE":"DECISIÓN DE NEGOCIO",title,c.scenario||"Selecciona la respuesta más adecuada.");
      html+=`<div class="option-grid">${c.options.map((o,i)=>`<button class="option-btn" data-answer="${i}"><span class="option-letter">${String.fromCharCode(65+i)}</span>${o}</button>`).join("")}</div>`;
    }
    $("#gameContent").innerHTML=html;
    $("#gameContent").querySelectorAll("[data-stage]").forEach(b=>b.addEventListener("click",()=>answerBuild(Number(b.dataset.stage),c)));
    $("#gameContent").querySelectorAll("[data-answer]").forEach(b=>b.addEventListener("click",()=>answerChoice(Number(b.dataset.answer),c,b)));
    if(currentMode==="race")startTimer();
  }
  function startTimer(){
    seconds=30;$("#timer").textContent=seconds;timerId=setInterval(()=>{seconds--;$("#timer").textContent=seconds;if(seconds<=0){stopTimer();if(index<queue.length){modeAnswered++;FunnelStats.award(false,0);showFeedback(false,"¡Se acabó el tiempo!","La respuesta no se contó como correcta. Revisa la explicación y continúa.");disableAnswers();$("#continueBtn").hidden=false;}}},1000);
  }
  function disableAnswers(){ $("#gameContent").querySelectorAll("button").forEach(b=>b.disabled=true); }
  function showFeedback(ok,title,body){const f=$("#feedback");f.className="feedback"+(ok?"":" bad");f.innerHTML=`<strong>${ok?"✓ ":"✕ "}${title}</strong>${body}`;f.hidden=false;}
  function answerBuild(stage,c){
    modeAnswered++;const ok=stage===c.stage;if(ok)modeCorrect++;
    const xp=FunnelStats.award(ok,15);if(ok)FunnelStats.applyEffect({trust:1});
    $("#gameContent").querySelectorAll("[data-stage]").forEach(b=>{b.disabled=true;if(Number(b.dataset.stage)===c.stage)b.classList.add("correct");if(Number(b.dataset.stage)===stage&&!ok)b.classList.add("wrong");});
    showFeedback(ok,ok?"¡Estrategia bien ubicada!":"No exactamente",`<b>${FUNNEL_STAGES[c.stage]}.</b> ${c.why}`);
    $("#continueBtn").hidden=false;$("#gameXP").textContent=xp;updateDashboard();
  }
  function answerChoice(choice,c,button){
    stopTimer();modeAnswered++;const ok=choice===c.answer;if(ok)modeCorrect++;
    const xp=FunnelStats.award(ok,currentMode==="race"?12:15);
    if(ok&&c.effect)FunnelStats.applyEffect(c.effect);
    if(ok&&currentMode==="mystery")FunnelStats.applyEffect({trust:3,loyalty:2});
    if(ok&&currentMode==="race")FunnelStats.applyEffect({trust:1});
    $("#gameContent").querySelectorAll("[data-answer]").forEach(b=>{b.disabled=true;if(Number(b.dataset.answer)===c.answer)b.classList.add("correct");});
    if(!ok)button.classList.add("wrong");
    showFeedback(ok,ok?"¡Buena decisión!":"Oportunidad de aprendizaje",c.why);
    $("#continueBtn").hidden=false;$("#gameXP").textContent=xp;updateDashboard();
  }
  function renderCampaign(){
    const choices={
      audience:["Jóvenes que buscan aprender habilidades digitales","Emprendedores de pequeños negocios","Clientes que ya compraron y necesitan soporte"],
      attraction:["Videos cortos educativos en redes sociales","Anuncios dirigidos a búsquedas relevantes","Recomendaciones de clientes actuales"],
      interest:["Guía gratuita con consejos prácticos","Publicaciones que explican un problema frecuente","Boletín con contenido útil"],
      trust:["Demostración y reseñas verificables","Preguntas frecuentes y políticas claras","Comparación honesta de beneficios y límites"],
      conversion:["Página de compra sencilla y precio transparente","Prueba gratuita con condiciones claras","Oferta relevante con fecha real de vencimiento"],
      loyalty:["Guía posventa y soporte oportuno","Programa de recompensas útil","Encuesta breve y seguimiento personalizado"]
    };
    const labels={audience:"Público objetivo",attraction:"Estrategia de atracción",interest:"Contenido de interés",trust:"Generar confianza",conversion:"Conversión",loyalty:"Fidelización"};
    $("#gameContent").innerHTML=challengeShell("DISEÑA TU CAMPAÑA","Arma un recorrido para tus clientes","Elige una opción por etapa. Después recibirás una evaluación de coherencia.")+
    `<div class="campaign-fields">${Object.entries(choices).map(([key,opts])=>`<div class="field-group"><label for="campaign-${key}">${labels[key]}</label><select id="campaign-${key}">${opts.map((o,i)=>`<option value="${i}">${o}</option>`).join("")}</select></div>`).join("")}</div><button class="btn btn-primary" id="evaluateCampaign" style="margin-top:22px">Evaluar mi campaña ↗</button>`;
    $("#evaluateCampaign").addEventListener("click",evaluateCampaign);
  }
  function evaluateCampaign(){
    const keys=["audience","attraction","interest","trust","conversion","loyalty"];selectedCampaign={};
    keys.forEach(k=>selectedCampaign[k]=Number($("#campaign-"+k).value));
    let score=0;
    if(selectedCampaign.audience===1&&selectedCampaign.attraction===0)score++;
    if(selectedCampaign.interest===0||selectedCampaign.interest===1)score++;
    if(selectedCampaign.trust===0||selectedCampaign.trust===1)score++;
    if(selectedCampaign.conversion===0||selectedCampaign.conversion===2)score++;
    if(selectedCampaign.loyalty===0||selectedCampaign.loyalty===1)score++;
    const points=score*10+10;FunnelStats.award(score>=3,points);modeAnswered=1;modeCorrect=score>=3?1:0;
    FunnelStats.applyEffect({visitors:score*35,leads:score*12,interested:score*6,buyers:score*2,loyal:score,trust:score*3,loyalty:score*3,revenue:score*150000});
    showFeedback(score>=3,"Evaluación: "+score+"/5 criterios fuertes",score>=3?"Tu campaña tiene una base coherente. "+campaignAdvice(score):"Tu campaña necesita mayor coherencia entre público, contenido y siguiente paso. "+campaignAdvice(score));
    $("#evaluateCampaign").disabled=true;$("#continueBtn").hidden=false;updateDashboard();
  }
  function campaignAdvice(score){return score>=4?"Punto fuerte: el recorrido conecta varias etapas. Revisa que las promesas sean honestas y mide cada paso.":"Mejora sugerida: define primero el público y el objetivo de cada etapa; luego elige mensajes y canales alineados con ese objetivo.";}
  function finishMode(){
    stopTimer();FunnelStats.completeMode(currentMode);
    if(modeCorrect>=Math.ceil(Math.max(modeAnswered,1)*.7))FunnelStats.addBadge("Estratega de "+modeNames[currentMode].toLowerCase());
    const s=FunnelStats.state;
    $("#resultTitle").textContent=modeCorrect===modeAnswered&&modeAnswered>0?"¡Misión impecable!":"Buen trabajo, estratega.";
    $("#resultSummary").textContent=`Terminaste “${modeNames[currentMode]}”. Cada intento te ayuda a detectar oportunidades en el embudo.`;
    $("#resultScore").textContent=s.xp;$("#resultRank").textContent=FunnelStats.rank();
    $("#resultCorrect").textContent=modeCorrect+" / "+modeAnswered;
    $("#resultAccuracy").textContent=(modeAnswered?Math.round(modeCorrect/modeAnswered*100):0)+"%";
    $("#resultConversion").textContent=FunnelStats.conversion().toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+"%";
    $("#resultTip").innerHTML="<strong>Tu siguiente paso:</strong> "+(modeCorrect===modeAnswered?"Prueba otro modo para aplicar lo aprendido en un contexto distinto.":"Revisa las explicaciones y prueba otra estrategia. Los datos te ayudan a decidir qué etapa necesita atención.");
    updateDashboard();showScreen("resultsScreen");
  }
  function goHome(){stopTimer();updateDashboard();showScreen("homeScreen");}
  document.querySelectorAll("[data-home]").forEach(b=>b.addEventListener("click",goHome));
  $("#startBtn").addEventListener("click",()=>startMode("build"));
  $("#tutorialBtn").addEventListener("click",()=>showScreen("tutorialScreen"));
  document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>startMode(b.dataset.mode)));
  $("#continueBtn").addEventListener("click",()=>{index++;renderCurrent();});
  $("#restartMode").addEventListener("click",()=>startMode(currentMode));
  $("#playAgain").addEventListener("click",()=>startMode(currentMode||"build"));
  $("#soundlessReset").addEventListener("click",()=>{if(confirm("¿Quieres borrar todo el progreso guardado y reiniciar las estadísticas?")){FunnelStats.reset();updateDashboard();}});
  let deferredInstallPrompt = null;
  const installButton = $("#installAppBtn");
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installButton) installButton.hidden = false;
  });
  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        alert("Para instalar: abre esta página desde Chrome, pulsa ⋮ y elige «Instalar aplicación» o «Añadir a pantalla de inicio». La instalación requiere que la app esté publicada en HTTPS.");
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installButton.hidden = true;
    });
  }
  window.addEventListener("appinstalled", () => {
    if (installButton) installButton.hidden = true;
  });
  updateDashboard();
})();
