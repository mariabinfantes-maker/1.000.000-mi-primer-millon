import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
const S="/tmp/claude-0/-home-user-1-000-000-mi-primer-millon/ab1c1d42-b597-536e-a467-9fde178942ad/scratchpad/casas";
const R="/home/user/1.000.000-mi-primer-millon";
const V=JSON.parse(readFileSync(R+"/data/vocabulario/vocabulario.json","utf8"));
const COLA=JSON.parse(await readFile(S+"/cola2.json","utf8"));
const DOM={"crm":["clientes","presupuestos"],"asistentes-ia":["contenido"],"comercio-electronico":["comercio"],
 "marketing-email":["marketing"],"atencion-cliente":["atencion"],
 "inventario-operaciones":["inventario","produccion","activos","servicio-campo"],
 "software-sectorial":["salud","formacion"]};
const capsDe=c=>V.capacidades.filter(x=>DOM[c].includes(x.dominioId));
const FIRMA=V.capacidades.find(c=>c.id==="cap.electronic_signature");

function bloque(p){
 if(p.q==="firma") return `[cap.electronic_signature] ${FIRMA.etiqueta} — ${FIRMA.definicion}`;
 const c=p.q.slice(5);
 return capsDe(c).map(x=>`[${x.id}] ${x.etiqueta} — ${x.definicion}`).join("\n");
}
const PROMPT=(t)=>`No escribas NADA fuera del JSON. Empieza por { y termina por }.

Lee SOLO las páginas oficiales de ${t.nombre} que te doy. Prohibido el conocimiento previo.

Para cada capacidad de la lista, di si la página DEMUESTRA que ${t.nombre} la tiene.

${t.preguntas.map(p=>bloque(p)).join("\n")}

Devuelve SÓLO:
{"resultados":[{"id":"<el id entre corchetes>","estado":"si"|"no_consta","cita":"frase literal de la página, máximo 15 palabras, o null","url":"<la página donde lo leíste, o null>"}]}

REGLAS QUE MANDAN:
- "si" SÓLO con cita literal de la página. Sin cita, es "no_consta".
- "no_consta" significa que no lo has encontrado. NO significa que no lo tenga.
- No deduzcas. Que tenga documentos no demuestra que se firmen. Que tenga un
  chat de equipo no demuestra que atienda a clientes.
- Un testimonio de un cliente NO es el fabricante: no vale como cita.
- Responde a TODAS las capacidades de la lista, una por una.`;

const sleep=m=>new Promise(r=>setTimeout(r,m));
async function gem(t){
 const urls=[t.url].filter(Boolean);
 const cuerpo={contents:[{parts:[{text:PROMPT(t)+`\n\nDirecciones:\n${urls.map(u=>"- "+u).join("\n")}`}]}],
  tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:16000}};
 const f=`${S}/pasada/_q-${t.id}.json`; await writeFile(f,JSON.stringify(cuerpo),"utf8");
 const so=await new Promise((res,rej)=>execFile("curl",["-sS","-X","POST",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
  "-H","Content-Type: application/json; charset=utf-8","--data",`@${f}`],
  {maxBuffer:20e6,timeout:180000},(e,s,r)=>e?rej(new Error(e.message+r)):res(s)));
 const p=JSON.parse(so); if(p.error) throw new Error(`API ${p.error.code}`);
 return {texto:p.candidates?.[0]?.content?.parts?.map(x=>x.text).join("")??"",
  leidas:(p.candidates?.[0]?.urlContextMetadata?.urlMetadata??[]).map(u=>`${u.urlRetrievalStatus==="URL_RETRIEVAL_STATUS_SUCCESS"?"OK ":"NO "}${u.retrievedUrl}`)};
}
let ok=0,ko=0;
for(let i=0;i<COLA.length;i+=2){
 await Promise.all(COLA.slice(i,i+2).map(async t=>{
  const d=`${S}/pasada/${t.id}.json`; if(existsSync(d)) return;
  try{ const r=await gem(t); await writeFile(d,JSON.stringify({...t,...r},null,1),"utf8"); ok++; }
  catch(e){ ko++; }}));
 process.stdout.write(`\r  ${Math.min(i+2,COLA.length)}/${COLA.length} · ok ${ok} · fallos ${ko}   `);
 await sleep(2500);
}
console.log("");
