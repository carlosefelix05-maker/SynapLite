#!/usr/bin/env node
/* Pruebas de SynapLite: ejecutan el código real de synaplite.html en Node (sin navegador).
   Uso:  node tests/run.js          Sale con código 1 si alguna falla. */
const {ev,ctx,store}=require("./harness");
const vm=require("vm"), setP=(name,obj)=>ev(`globalThis.${name}=`+JSON.stringify(obj));
let pass=0, fail=0; const fails=[];
async function t(name,fn){ try{ await fn(); pass++; }catch(e){ fail++; fails.push(name+" → "+e.message); } }
function eq(a,b,m){ if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error((m||"")+" esperado "+JSON.stringify(b)+" y salió "+JSON.stringify(a)); }
function near(a,b,tol,m){ if(a===null||a===undefined||Math.abs(a-b)>(tol||0.05)) throw new Error((m||"")+" esperado ≈"+b+" y salió "+a); }
function ok(c,m){ if(!c) throw new Error(m||"condición falsa"); }
const NOW=Date.now(), D=864e5;
const dk=n=>ev(`dayKey(new Date(${NOW-n*D}))`);
const base=(o)=>Object.assign({id:"p1",name:"Prueba",bed:"1",age:"68",sex:"M",peso:"80",talla:"170",vitals:[],labs:[],vma:[],onVMA:false,infusiones:[],medicamentos:[],pendientes:[],comentarios:[],archivos:[],balance:[],devices:[]},o||{});
const cardVal=(h,title)=>{ const m=h.split('class="ccard').find(c=>c.includes(`>${title}`)); if(!m) return null; const v=/class="cval">([^<]*)/.exec(m); return v?v[1].trim():null; };

(async()=>{
/* ---------- lectura de laboratorios ---------- */
await t("pegado: valores, comas decimales y unidades",()=>{
  const r=ev(`parseLabText("Glu 118 mg/dL, Cr 1,8, Na 138, K 3.2, Hb 9.1, Plaq 95,000")`).rec;
  eq([r.glu,r.cr,r.na,r.k,r.hb,r.plaq],["118","1.8","138","3.2","9.1","95000"]);
});
await t("pegado: fecha y hora del párrafo",()=>{
  const w=ev(`parseLabText("Laboratorios del 02/11/2026 06:30 hrs: Glu 100, Cr 1.0")`).when;
  eq(w,{date:"2026-11-02",time:"06:30"});
});
await t("pegado: los decimales no se leen como fecha",()=>{
  const x=ev(`parseLabText("Cr 1.2, Alb 2.8, Hb 9.8")`); eq([x.rec.cr,x.rec.alb,x.rec.hb],["1.2","2.8","9.8"]); eq(x.when.date,null);
});
await t("gasometría: electrolitos del gasómetro quedan aparte de la química",()=>{
  const r=ev(`parseLabText("Glu 118, Na 130, K 5.1, Cl 98. Gasometría arterial: FiO2 40%, pH 7.31, pCO2 30, pO2 80, HCO3 15, Na+ 132, K 3.8, Cl 104, Glu 120, Hb 9.1, Ca++ 1.05, AG 14")`).rec;
  eq([r.na,r.k,r.cl,r.glu],["130","5.1","98","118"],"química");
  eq([r.gna,r.gk,r.gcl,r.ggl,r.ghb,r.cai,r.gag,r.gfio2],["132","3.8","104","120","9.1","1.05","14","40"],"gas");
  eq(r.gtipo,"arterial");
});
await t("gasometría sola sin encabezado: todo es del gasómetro",()=>{
  const r=ev(`parseLabText("Na 138, K 3.8, Cl 104, Glu 120, pH 7.3, pCO2 38, pO2 90, HCO3 18")`).rec;
  eq([r.gna,r.gk,r.gcl,r.ggl,r.na],["138","3.8","104","120",undefined]);
});
await t("solo química: no se confunde con gasometría",()=>{
  const r=ev(`parseLabText("Glu 118, Na 138, K 4, Cr 1")`).rec; eq([r.glu,r.na,r.gna],["118","138",undefined]);
});
/* ---------- semáforo ---------- */
await t("semáforo: Cr por sexo, pH arterial vs venoso",()=>{
  setP("PM",base({sex:"M"})); setP("PF",base({sex:"F"}));
  eq(ev(`labStatus("cr","1.2",PM,{})`),""); eq(ev(`labStatus("cr","1.2",PF,{})`),"warn"); eq(ev(`labStatus("cr","4.2",PM,{})`),"bad");
  eq(ev(`labStatus("ph","7.33",PM,{gtipo:"venosa"})`),""); eq(ev(`labStatus("ph","7.33",PM,{gtipo:"arterial"})`),"warn");
});
/* ---------- cálculos clínicos ---------- */
await t("TFGe CKD-EPI 2021 y Cockcroft-Gault",()=>{
  setP("P",base({labs:[{ts:NOW,cr:"1.8"}]}));
  const h=ev(`calcPaneHTML(P)`); eq(cardVal(h,"TFGe · CKD-EPI 2021"),"40"); eq(cardVal(h,"Depuración · Cockcroft-Gault"),"44");
  near(ev(`cgOf(P)`),44.4,0.2);
});
await t("brecha aniónica, Ca y Na corregidos, osmolaridad",()=>{
  setP("P",base({labs:[{ts:NOW,na:"130",cl:"98",hco3:"14",alb:"2.1",ca:"7.2",glu:"420",bun:"40"}]}));
  const h=ev(`calcPaneHTML(P)`);
  eq(cardVal(h,"Brecha aniónica"),"18"); eq(cardVal(h,"Calcio corregido por albúmina"),"8.7"); eq(cardVal(h,"Sodio corregido por glucosa"),"135.1");
  eq(cardVal(h,"Osmolaridad sérica calculada"),"297.6");
});
await t("PaFi, SpO2/FiO2 y gradiente A-a con la presión de Los Mochis",()=>{
  setP("P",base({vitals:[{ts:NOW,sato2:"92",gcs:"15"}],labs:[{ts:NOW,po2:"80",pco2:"40",gtipo:"arterial",gfio2:"40"}]}));
  const h=ev(`calcPaneHTML(P)`); eq(cardVal(h,"PaFi (PaO₂ / FiO₂)"),"200"); eq(ev("PATM"),759);
  near(parseFloat(cardVal(h,"Gradiente A-a de O₂ · Los Mochis (10 msnm)")),284.8-40/0.8-80+0.0,0.5);   // 0.4×(759−47)=284.8; −50; −80 → 154.8
});
await t("fioFor: la FiO2 de la gasometría tiene prioridad",()=>{
  setP("P",base({onVMA:true,vma:[{ts:NOW,fio2:"60"}]}));
  near(ev(`fioFor(P,{gfio2:"40"}).n`),0.4,0.001); near(ev(`fioFor(P,{}).n`),0.6,0.001);
});
await t("SOFA: componentes y total",()=>{
  setP("P",base({onVMA:true,vitals:[{ts:NOW,ta:"85/50",gcs:"13",fc:"118",fr:"26",sato2:"91",temp:"38.6"}],
    labs:[{ts:NOW,cr:"2.6",plaq:"70",bt:"2.4",po2:"70",gtipo:"arterial"}],vma:[{ts:NOW,fio2:"60"}],
    infusiones:[{id:"i",name:"Norepinefrina",dose:"0.2 mcg/kg/min",active:true}]}));
  const s=ev(`sofaOf(P)`), g=k=>s.parts.find(x=>x.k===k).pts;
  eq([g("res"),g("coa"),g("hep"),g("cv"),g("cns"),g("ren")],[3,2,2,4,1,2]); eq(s.total,14);
});
await t("SOFA: renal también por diuresis y componentes faltantes",()=>{
  setP("P",base({labs:[{ts:NOW,cr:"1.0"}]}));
  const s=ev(`sofaOf(P)`); eq(s.parts.find(x=>x.k==="ren").pts,0); eq(s.parts.find(x=>x.k==="res").pts,null);
  ok(s.known<6,"debe marcar parcial");
});
await t("qSOFA y NEWS2",()=>{
  setP("P",base({onVMA:true,vitals:[{ts:NOW,ta:"85/50",gcs:"13",fc:"118",fr:"26",sato2:"91",temp:"38.6"}]}));
  eq(ev(`qsofaOf(P).total`),3); const n=ev(`news2Of(P)`); eq(n.total,17); ok(n.red,"parámetro rojo");
});
await t("dosis de infusión: parseo y conversiones",()=>{
  eq(ev(`parseDose("0.1 mcg/kg/min")`),{n:0.1,amtU:"mcg",perKg:true,per:"min"});
  eq(ev(`parseDose("5 mg/h")`),{n:5,amtU:"mg",perKg:false,per:"h"});
  near(ev(`doseMcgKgMin(P,parseDose("6 mg/h"))`),1.25,0.001);   // 6000 mcg/h ÷ 60 ÷ 80 kg
});
await t("calculadora de infusiones: mL/h",()=>{
  setP("P",base({peso:"80"}));
  near(ev(`infRate(P,{dose:"0.2 mcg/kg/min",amt:4,amtU:"mg",vol:250})`),60,0.1);     // 960 mcg/h ÷ 16 mcg/mL
  near(ev(`infRate(P,{dose:"0.03 UI/min",amt:20,amtU:"UI",vol:100})`),9,0.1);
  eq(ev(`infRate(P,{dose:"0.03 UI/min",amt:4,amtU:"mg",vol:100})`),null,"unidades incompatibles");
});
await t("balance por turno y diuresis mL/kg/h",()=>{
  const start=ev(`balPeriodStart(new Date(${NOW}))`);
  const at=h=>new Date(start.getTime()+(h)*36e5).toISOString();
  setP("P",base({peso:"70",balance:[{id:"1",ts:at(2),k:"in",cat:"Soluciones IV",ml:1500},{id:"2",ts:at(4),k:"out",cat:"Diuresis",ml:300},{id:"3",ts:at(9),k:"out",cat:"Diuresis",ml:250},{id:"4",ts:at(16),k:"in",cat:"Soluciones IV",ml:900}]}));
  const st=ev(`balStats(P,new Date(${start.getTime()}),new Date(${start.getTime()+864e5+1}))`);
  eq([st.tot.inn,st.tot.out,st.tot.net,st.tot.diu],[2400,550,1850,550]);
  near(st.rows[0].rate,300/7/70,0.001); near(st.tot.rate,550/24/70,0.001);
});
await t("antibiótico: día de tratamiento y suspensión",()=>{
  eq(ev(`atbDays({start:"${dk(3)}",active:true})`),4);
  eq(ev(`atbDays({start:"${dk(6)}",stop:"${dk(2)}",active:false})`),5);
  eq(ev(`isAtb({name:"Meropenem"})`),true); eq(ev(`isAtb({name:"Omeprazol"})`),false); eq(ev(`isAtb({name:"Omeprazol",atb:true})`),true);
});
await t("estancia y dispositivos",()=>{
  eq(ev(`diaHosp({ingreso:"${dk(4)}"})`),5); eq(ev(`diaHosp({})`),null);
  eq(ev(`devDays({fecha:"${dk(2)}",retirado:"${dk(0)}"})`),3);
});
/* ---------- interpretación de gasometría ---------- */
await t("gasometría: acidosis metabólica con brecha elevada y compensación",()=>{
  setP("P",base({labs:[{ts:NOW,alb:"2.5"}]}));
  const g=ev(`gasInterp({gtipo:"arterial",ph:"7.28",pco2:"28",po2:"85",hco3:"13",lactato:"4.6",gna:"132",gcl:"98",gfio2:"40"},P)`);
  ok(/acidosis metabólica/.test(g)&&/compensación respiratoria adecuada/.test(g),g); ok(/Brecha aniónica elevada \(24\.8/.test(g),g); ok(/PaFi 213/.test(g),g); ok(/grave \(4\.6\)/.test(g),g);
});
await t("gasometría: respiratoria, alcalosis y venosa",()=>{
  setP("P",base());
  ok(/acidosis respiratoria/.test(ev(`gasInterp({gtipo:"arterial",ph:"7.25",pco2:"70",hco3:"26"},P)`)));
  ok(/alcalosis respiratoria/.test(ev(`gasInterp({gtipo:"arterial",ph:"7.55",pco2:"25",hco3:"22"},P)`)));
  ok(/alcalosis metabólica/.test(ev(`gasInterp({gtipo:"arterial",ph:"7.52",pco2:"48",hco3:"38"},P)`)));
  ok(/venosa permite|no permite valorar la oxigenación/.test(ev(`gasInterp({gtipo:"venosa",ph:"7.36",pco2:"48",po2:"40",hco3:"26"},P)`)));
  ok(/equilibrio ácido-base normal/.test(ev(`gasInterp({gtipo:"arterial",ph:"7.40",pco2:"40",hco3:"24"},P)`)));
});
/* ---------- alertas ---------- */
await t("alertas: lesión renal, caída de Hb y plaquetas, antibiótico día 3",()=>{
  setP("P",base({age:"75",sex:"F",peso:"60",
    labs:[{ts:NOW-30*36e5,cr:"1.0",hb:"12",plaq:"250"},{ts:NOW-1,cr:"1.5",hb:"9.5",plaq:"140"}],
    medicamentos:[{id:"m",name:"Meropenem",active:true,atb:true,start:dk(3),ts:new Date().toISOString()}]}));
  const a=ev(`alertsOf(P)`).map(x=>x.txt).join(" | ");
  ok(/Cr subió 0\.5/.test(a),a); ok(/Hb cayó 2\.5/.test(a),a); ok(/Plaquetas cayeron 44/.test(a),a); ok(/Meropenem día 4/.test(a),a); ok(/ajuste renal/.test(a),a);
});
await t("alertas: paciente de alta no genera alertas",()=>{ setP("P",base({alta:new Date().toISOString()})); eq(ev(`alertsOf(P)`),[]); });
/* ---------- cifrado ---------- */
await t("cifrado: activar, abrir con contraseña y con clave de recuperación",async()=>{
  ev(`state={patients:[{id:"z",name:"Secreto"}]}`);
  const rec=await ev(`secEnable("clave-123",5)`);
  ok(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/.test(rec),"formato de clave");
  ok(!/Secreto/.test(store.get("synaplite_enc_v1")),"el texto plano no debe aparecer");
  const pkg=await ev(`encPackage()`); globalThis.__pkg=pkg;
  const a=await ev(`openEncPackage(JSON.parse(${JSON.stringify(JSON.stringify(pkg))}),"clave-123")`); eq(a.patients[0].name,"Secreto");
  const b=await ev(`openEncPackage(JSON.parse(${JSON.stringify(JSON.stringify(pkg))}),${JSON.stringify(rec.toLowerCase())})`); eq(b.patients[0].name,"Secreto");
  let bad=false; try{ await ev(`openEncPackage(JSON.parse(${JSON.stringify(JSON.stringify(pkg))}),"mala")`); }catch(e){ bad=true; } ok(bad,"debe rechazar clave mala");
});
await t("transferencia cifrada con código",async()=>{
  const pkg=await ev(`transferPackage("1234-5678-9012")`), js=JSON.stringify(JSON.stringify(pkg));
  const x=await ev(`openTransfer(JSON.parse(${js}),"123456789012")`); eq(x.patients[0].name,"Secreto");
  let bad=false; try{ await ev(`openTransfer(JSON.parse(${js}),"000000000000")`); }catch(e){ bad=true; } ok(bad,"código malo");
});
/* ---------- bitácora ---------- */
await t("bitácora: resumen de cambios",()=>{
  const a={patients:[{id:"1",name:"Ana",medicamentos:[],labs:[]}]}, b={patients:[{id:"1",name:"Ana",medicamentos:[{id:"m"}],labs:[],dx:"x"},{id:"2",name:"Beto"}]};
  const s=ev(`diffSummary(${JSON.stringify(a)},${JSON.stringify(b)})`);
  ok(/Ana: \+1 medicamentos; diagnóstico editado/.test(s)&&/Agregó a Beto/.test(s),s);
  ok(/Eliminó a Ana/.test(ev(`diffSummary(${JSON.stringify(a)},{patients:[]})`)));
});
/* ---------- respaldo ---------- */
await t("respaldo: último horario ya vencido",()=>{
  const slot=ev(`bkLastSlot("21:00").getTime()`); ok(slot<=Date.now()&&Date.now()-slot<=864e5+1000,"dentro de 24 h");
  eq(ev(`bkLastSlot("21:00").getHours()`),21);
});
await t("entrega de guardia: texto con gravedad",()=>{
  ev(`state={patients:[${JSON.stringify(base({name:"Ana",onVMA:true}))}]}`);
  const tx=ev(`entregaText()`); ok(/ANA/.test(tx)&&/EN VIGILANCIA/.test(tx),tx);
});

console.log(`\n${pass} pruebas pasaron, ${fail} fallaron`);
fails.forEach(f=>console.log("  ✗ "+f));
process.exit(fail?1:0);
})();
