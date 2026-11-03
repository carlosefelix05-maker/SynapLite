/* Arnés: carga el código real de synaplite.html en un contexto de Node sin navegador. */
const fs=require("fs"), vm=require("vm"), path=require("path"), nodeCrypto=require("crypto");
const html=fs.readFileSync(path.join(__dirname,"..","synaplite.html"),"utf8");
const i=html.indexOf('<script>\n"use strict"'), j=html.indexOf("/* ---------------- arranque ---------------- */",i);
if(i<0||j<0){ console.error("No se encontró el script de la app"); process.exit(2); }
const code=html.slice(i+"<script>".length,j);

/* DOM mínimo: cualquier propiedad o llamada devuelve otro elemento falso. */
function el(){
  const f=function(){ return el(); };
  return new Proxy(f,{
    get:(t,k)=>{
      if(k===Symbol.toPrimitive) return ()=>"";
      if(k==="classList") return {add(){},remove(){},toggle(){},contains(){return false;}};
      if(k==="style"||k==="dataset") return {};
      if(k==="innerHTML"||k==="textContent"||k==="value"||k==="innerText"||k==="id") return "";
      if(k==="hidden") return false;
      if(k==="length") return 0;
      if(k==="then") return undefined;
      return el();
    },
    set:()=>true, apply:()=>el()
  });
}
const store=new Map();
const sandbox={
  console, Date, Math, JSON, Promise, Uint8Array, Map, Set, Array, Object, String, Number, RegExp, Error, isNaN, parseFloat, parseInt,
  TextEncoder, TextDecoder, atob:s=>Buffer.from(s,"base64").toString("binary"), btoa:s=>Buffer.from(s,"binary").toString("base64"),
  crypto:nodeCrypto.webcrypto,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()},
  document:el(), navigator:{}, setTimeout:()=>0, setInterval:()=>0, clearTimeout(){}, clearInterval(){},
  matchMedia:()=>({matches:false,addEventListener(){}}), requestAnimationFrame(){}, alert(){}, confirm:()=>true, print(){}, Blob:function(){}, FileReader:function(){}, URL:{createObjectURL:()=>""}, Intl, Symbol
};
sandbox.window=sandbox; sandbox.globalThis=sandbox; sandbox.self=sandbox;
sandbox.addEventListener=()=>{}; sandbox.removeEventListener=()=>{};
const ctx=vm.createContext(sandbox);
vm.runInContext(code,ctx,{filename:"synaplite.html"});
const ev=s=>vm.runInContext(s,ctx);
const setP=(name,obj)=>ev(`globalThis.${name}=`+JSON.stringify(obj));

module.exports={ev,ctx,store};
