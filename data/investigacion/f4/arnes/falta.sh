#!/bin/bash
# Recuperacion acotada: pregunta SOLO por los campos que faltan. Una URL por llamada.
# Uso: ./falta.sh <id> <nombre> <url> <campo1,campo2,...>
ID="$1"; NOMBRE="$2"; U="$3"; CAMPOS="$4"
SKEL=$(python3 -c "
import sys,json
cs=sys.argv[1].split(',')
print(json.dumps({c:{'v':'si|no_consta','cita':''} for c in cs},ensure_ascii=False))
" "$CAMPOS")
PROMPT="Lee UNICAMENTE esta pagina oficial de \"$NOMBRE\": $U

Responde solo sobre lo que diga ESA pagina. Reglas estrictas:
- Si algo NO aparece literalmente en la pagina, responde \"no_consta\". NUNCA respondas que el producto no lo tiene.
- Para cada \"si\" copia una cita LITERAL de la pagina, en su idioma original, de 5 a 25 palabras.
- No infieras, no completes con conocimiento previo, no supongas.

Devuelve SOLO este JSON, sin markdown:
{\"idioma_es\":\"si|no_consta\",\"espana\":\"si|no_consta\",\"cita_espana\":\"\",\"campos\":$SKEL}"
jq -n --arg p "$PROMPT" '{contents:[{parts:[{text:$p}]}],tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:8000,thinkingConfig:{thinkingBudget:1024}}}' > "qf-$ID.json"
for i in 1 2 3 4; do
  curl -sS --max-time 240 -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" -H "Content-Type: application/json" -d @"qf-$ID.json" > "rf-$ID.json"
  [ "$(wc -c < "rf-$ID.json")" -gt 200 ] && break; sleep $((i*6))
done
rm -f "qf-$ID.json"
python3 - "$ID" "$U" <<'PY'
import json,sys,re
i,u=sys.argv[1],sys.argv[2]
try: d=json.load(open(f"rf-{i}.json"))
except Exception: print(f"  {i}: CORTE"); sys.exit(0)
if "error" in d: print(f"  {i}: ERROR {d['error'].get('code')} {d['error'].get('message','')[:70]}"); sys.exit(0)
c=d["candidates"][0]
urls=[(m.get("retrievedUrl",""),m.get("urlRetrievalStatus","")) for m in c.get("urlContextMetadata",{}).get("urlMetadata",[])]
ok=[r for r,s in urls if s=="URL_RETRIEVAL_STATUS_SUCCESS"]
t="".join(x.get("text","") for x in c.get("content",{}).get("parts",[]))
m=re.search(r"\{[\s\S]*\}",t)
if not m: print(f"  {i}: sin JSON · leidas {len(ok)}/{len(urls)}"); sys.exit(0)
try: j=json.loads(m.group(0))
except Exception as e: print(f"  {i}: JSON invalido · leidas {len(ok)}/{len(urls)}"); sys.exit(0)
json.dump({"pedida":u,"leidas":ok,"urls":urls,"datos":j},open(f"falta-{i}.json","w"),ensure_ascii=False,indent=1)
camps=j.get("campos",{})
si=[k for k,v in camps.items() if isinstance(v,dict) and v.get("v")=="si"]
print(f"  {i}: leidas {len(ok)}/{len(urls)} · es={j.get('idioma_es')} espana={j.get('espana')} · si={len(si)}/{len(camps)} {si}")
PY
