import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
const S="/tmp/claude-0/-home-user-1-000-000-mi-primer-millon/ab1c1d42-b597-536e-a467-9fde178942ad/scratchpad/casas";
const R="/home/user/1.000.000-mi-primer-millon";
const V=JSON.parse(readFileSync(R+"/data/vocabulario/vocabulario.json","utf8"));
const COLA=JSON.parse(await readFile(S+"/cola3.json","utf8"));
const DOM={"crm":["clientes","presupuestos"],"gestion-proyectos":["trabajo","comunicacion-interna"],
 "asistentes-ia":["contenido"],"facturacion-contabilidad":["facturacion","costes"],
 "reservas-citas":["citas"],"atencion-cliente":["atencion"],"comercio-electronico":["comercio"],
 "automatizacion-integraciones":["automatizacion","datos"],"marketing-email":["marketing"],
 "recursos-humanos":["personas"],"inventario-operaciones":["inventario","produccion","activos","servicio-campo"],
 "creacion-web-hosting":["presencia"],"firma-gestion-documental":["documentos"],
 "software-sectorial":["salud","formacion"]};
const EXTRA={"firma-gestion-documental":["cap.electronic_signature"]};
const capsDe=c=>[...V.capacidades.filter(x=>DOM[c].includes(x.dominioId)),
  ...(EXTRA[c]??[]).map(id=>V.capacidades.find(x=>x.id===id))];

const PROMPT=(t)=>`No escribas NADA fuera del JSON. Empieza por { y termina por }.

Lee SOLO las páginas oficiales de ${t.nombre} que te doy. Prohibido el conocimiento previo.

Su página dice que ${t.nombre} hace algo de «${t.nombreCasa}»${t.cita?`: «${t.cita}»`:""}.
Queremos el recibo exacto: de esta lista, ¿qué DEMUESTRA la página?

${capsDe(t.casa).map(x=>`[${x.id}] ${x.etiqueta} — ${x.definicion}`).join("\n")}

Devuelve SÓLO:
{"resultados":[{"id":"<el id entre corchetes>","estado":"si"|"no_consta","cita":"frase literal de la página, máximo 15 palabras, o null","url":"<la página donde lo leíste, o null>"}]}

REGLAS QUE MANDAN:
- "si" SÓLO con cita literal de la página. Sin cita, es "no_consta".
- "no_consta" significa que no lo has encontrado. NO significa que no lo tenga.
- No deduzcas. Que tenga documentos no demuestra que se firmen. Que tenga un
  chat de equipo no demuestra que atienda a clientes. Que tenga API no
  demuestra que traiga plantillas hechas.
- Un testimonio de un cliente NO es el fabricante: no vale como cita.
- Responde a TODAS las capacidades de la lista, una por una.`;

const sleep=m=>new Promise(r=>setTimeout(r,m));
async function gem(t){
 const cuerpo={contents:[{parts:[{text:PROMPT(t)+`\n\nDirecciones:\n${t.urls.map(u=>"- "+u).join("\n")}`}]}],
  tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:16000}};
 const f=`${S}/dirigidas/_q-${t.id}.json`; await writeFile(f,JSON.stringify(cuerpo),"utf8");
 const so=await new Promise((res,rej)=>execFile("curl",["-sS","-X","POST",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
  "-H","Content-Type: application/json; charset=utf-8","--data",`@${f}`],
  {maxBuffer:20e6,timeout:180000},(e,s,r)=>e?rej(new Error(e.message+r)):res(s)));
 const p=JSON.parse(so); if(p.error) throw new Error(`API ${p.error.code}`);
 return {texto:p.candidates?.[0]?.content?.parts?.map(x=>x.text).join("")??"",
  leidas:(p.candidates?.[0]?.urlContextMetadata?.urlMetadata??[]).map(u=>`${u.urlRetrievalStatus==="URL_RETRIEVAL_STATUS_SUCCESS"?"OK ":"NO "}${u.retrievedUrl}`)};
}
const N=Number(process.env.CONC||4);
let ok=0,ko=0;
for(let i=0;i<COLA.length;i+=N){
 await Promise.all(COLA.slice(i,i+N).map(async t=>{
  const d=`${S}/dirigidas/${t.id}.json`; if(existsSync(d)) return;
  try{ const r=await gem(t); await writeFile(d,JSON.stringify({...t,...r},null,1),"utf8"); ok++; }
  catch(e){ ko++; }}));
 process.stdout.write(`\r  ${Math.min(i+N,COLA.length)}/${COLA.length} · ok ${ok} · fallos ${ko}   `);
 await sleep(1500);
}
console.log("");
