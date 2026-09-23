import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
const S="/tmp/claude-0/-home-user-1-000-000-mi-primer-millon/ab1c1d42-b597-536e-a467-9fde178942ad/scratchpad/casas";
const R="/home/user/1.000.000-mi-primer-millon";
const V=JSON.parse(readFileSync(R+"/data/vocabulario/vocabulario.json","utf8"));
const etq=new Map(V.capacidades.map(c=>[c.id,c.etiqueta]));
const F=new Map(JSON.parse(readFileSync(S+"/tools.json","utf8")).map(t=>[t.id,t]));
const pares=JSON.parse(await readFile(S+"/pares.json","utf8")).filter(p=>p.estado==="si");
const porH=new Map();
for(const p of pares){ if(!porH.has(p.id)) porH.set(p.id,{id:p.id,nombre:p.herramienta,caps:[]});
 porH.get(p.id).caps.push(p); }

const PROMPT=(t)=>`No escribas NADA fuera del JSON. Empieza por { y termina por }.

Lee SOLO las páginas oficiales de ${t.nombre} que te doy. Prohibido el conocimiento previo.

Ya sabemos que ${t.nombre} tiene estas capacidades. Lo que falta es CÓMO las
tiene. Para cada una, elige una sola opción:

- "nativa": es el producto o una parte central de él, hecha por ${t.nombre}.
- "modulo": existe dentro de la suite, a veces como aplicación o módulo aparte
  que se contrata o se activa.
- "integracion": sólo funciona conectando OTRA herramienta de otra empresa
  (Zapier, Google Calendar, Stripe...). Entonces di cuál en "integraCon".

${t.caps.map(c=>`[${c.cap}] ${etq.get(c.cap)} — la página decía: «${c.cita}»`).join("\n")}

Devuelve SÓLO:
{"resultados":[{"id":"<el id entre corchetes>","profundidad":"nativa"|"modulo"|"integracion","integraCon":"<sólo si es integracion, si no null>","cita":"frase literal que lo sostiene, máximo 15 palabras, o null"}]}

REGLAS:
- Si la página no permite distinguir entre nativa y modulo, elige "modulo":
  es lo que menos afirma.
- "integracion" SÓLO si la página nombra la herramienta de terceros.
- Responde a TODAS, una por una.`;

const sleep=m=>new Promise(r=>setTimeout(r,m));
const N=Number(process.env.CONC||3);
let ok=0,ko=0; const L=[...porH.values()];
for(let i=0;i<L.length;i+=N){
 await Promise.all(L.slice(i,i+N).map(async t=>{
  const d=`${S}/prof/${t.id}.json`; if(existsSync(d)) return;
  const h=F.get(t.id); const urls=[h?.url,h?.precios].filter(Boolean);
  const cuerpo={contents:[{parts:[{text:PROMPT(t)+`\n\nDirecciones:\n${urls.map(u=>"- "+u).join("\n")}`}]}],
   tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:16000}};
  const f=`${S}/prof/_q-${t.id}.json`; await writeFile(f,JSON.stringify(cuerpo),"utf8");
  try{
   const so=await new Promise((res,rej)=>execFile("curl",["-sS","-X","POST",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    "-H","Content-Type: application/json; charset=utf-8","--data",`@${f}`],
    {maxBuffer:20e6,timeout:180000},(e,s,r)=>e?rej(new Error(e.message+r)):res(s)));
   const p=JSON.parse(so); if(p.error) throw new Error("API "+p.error.code);
   await writeFile(d,JSON.stringify({...t,texto:p.candidates?.[0]?.content?.parts?.map(x=>x.text).join("")??"",
    leidas:(p.candidates?.[0]?.urlContextMetadata?.urlMetadata??[]).map(u=>`${u.urlRetrievalStatus==="URL_RETRIEVAL_STATUS_SUCCESS"?"OK ":"NO "}${u.retrievedUrl}`)},null,1),"utf8");
   ok++;
  }catch(e){ ko++; }}));
 process.stdout.write(`\r  ${Math.min(i+N,L.length)}/${L.length} · ok ${ok} · fallos ${ko}   `);
 await sleep(1500);
}
console.log("");
