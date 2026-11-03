#!/usr/bin/env node
/* Regenera la tabla de rangos de docs/FORMULAS.md a partir de LAB_REF (entre las marcas RANGOS). */
const fs=require("fs"), path=require("path"), {ev}=require("./harness");
const ref=ev(`JSON.parse(JSON.stringify(LAB_REF))`), lab=ev(`JSON.parse(JSON.stringify(LAB_FIELDS.map(f=>({k:f.k,label:f.gl||f.label,ph:f.ph}))))`);
const lbl=Object.fromEntries(lab.map(f=>[f.k,f]));
const fmt=r=>{ const parts=[]; const one=x=>{ const o=[]; if(x.lo!=null||x.hi!=null) o.push(`normal ${x.lo!=null?x.lo:"—"} a ${x.hi!=null?x.hi:"—"}`); if(x.blo!=null) o.push(`grave < ${x.blo}`); if(x.bhi!=null) o.push(`grave ≥ ${x.bhi}`); return o.join("; "); };
  if(r.M||r.F){ const s=[]; if(r.M) s.push("H: "+one(r.M)); if(r.F) s.push("M: "+one(r.F)); const g=one({blo:r.blo,bhi:r.bhi}); return s.join(" · ")+(g?" · "+g:""); } return one(r); };
const rows=Object.keys(ref).map(k=>`| ${lbl[k]?lbl[k].label:k} | ${lbl[k]?lbl[k].ph:""} | ${fmt(ref[k])} | |`).join("\n");
const f=path.join(__dirname,"..","docs","FORMULAS.md"); let md=fs.readFileSync(f,"utf8");
md=md.replace(/<!-- RANGOS -->[\s\S]*<!-- \/RANGOS -->/,`<!-- RANGOS -->\n| Parámetro | Unidad | Rangos que usa la app (normal = sin alerta; grave = rojo) | ✔ |\n|---|---|---|---|\n${rows}\n<!-- /RANGOS -->`);
fs.writeFileSync(f,md); console.log("docs/FORMULAS.md actualizado");
