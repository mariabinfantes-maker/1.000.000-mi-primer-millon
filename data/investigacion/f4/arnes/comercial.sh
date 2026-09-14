#!/bin/bash
# Investigacion comercial: lee UNA pagina oficial de programa de afiliacion/referidos.
# Uso: ./comercial.sh <id> <nombre> <url>
ID="$1"; NOMBRE="$2"; U="$3"
PROMPT="Lee UNICAMENTE esta pagina de \"$NOMBRE\": $U

Es una pagina sobre un posible programa de afiliacion, referidos o partners. Responde SOLO sobre lo que diga ESA pagina.

Reglas estrictas:
- Si un dato NO aparece literalmente en la pagina, pon \"no_consta\". NUNCA digas que no existe o que no lo tiene.
- Cada \"si\" y cada dato debe ir con una cita LITERAL copiada de la pagina, en su idioma original, de 5 a 30 palabras.
- No infieras, no uses conocimiento previo, no supongas.

Distingue con cuidado el TIPO de programa:
- \"afiliacion_abierta\": cualquiera (blog, web, medio) puede inscribirse y cobrar comision por recomendar.
- \"referidos_clientes\": solo los CLIENTES ya existentes del producto pueden recomendar.
- \"partner_reseller\": agencias o distribuidores que revenden o implantan.
- \"no_consta\".

Devuelve SOLO este JSON, sin markdown:
{
 \"programa_existe\":\"si|no_consta\",
 \"tipo\":\"afiliacion_abierta|referidos_clientes|partner_reseller|no_consta\",
 \"cita_tipo\":\"\",
 \"comision\":{\"v\":\"si|no_consta\",\"cita\":\"\"},
 \"recurrencia\":{\"v\":\"si|no_consta\",\"cita\":\"\"},
 \"cookie\":{\"v\":\"si|no_consta\",\"cita\":\"\"},
 \"condiciones\":{\"v\":\"si|no_consta\",\"cita\":\"\"},
 \"abierto_desde_espana\":{\"v\":\"si|no_consta\",\"cita\":\"\"},
 \"promociona_producto_para_negocios\":{\"v\":\"si|no_consta\",\"cita\":\"\"},
 \"activo\":{\"v\":\"si|no_consta\",\"cita\":\"\"},
 \"red_de_afiliacion\":{\"v\":\"si|no_consta\",\"cita\":\"\"}
}"
jq -n --arg p "$PROMPT" '{contents:[{parts:[{text:$p}]}],tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:9000,thinkingConfig:{thinkingBudget:1024}}}' > "qc-$ID.json"
for i in 1 2 3 4; do
  curl -sS --max-time 240 -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" -H "Content-Type: application/json" -d @"qc-$ID.json" > "rc-$ID.json"
  [ "$(wc -c < "rc-$ID.json")" -gt 200 ] && break; sleep $((i*6))
done
rm -f "qc-$ID.json"
python3 - "$ID" "$U" <<'PY'
import json,sys,re
i,u=sys.argv[1],sys.argv[2]
try: d=json.load(open(f"rc-{i}.json"))
except Exception: print(f"  {i}: CORTE"); sys.exit(0)
if "error" in d: print(f"  {i}: ERROR {d['error'].get('code')} {d['error'].get('message','')[:70]}"); sys.exit(0)
c=d["candidates"][0]
urls=[(m.get("retrievedUrl",""),m.get("urlRetrievalStatus","")) for m in c.get("urlContextMetadata",{}).get("urlMetadata",[])]
ok=[r for r,s in urls if s=="URL_RETRIEVAL_STATUS_SUCCESS"]
t="".join(x.get("text","") for x in c.get("content",{}).get("parts",[]))
m=re.search(r"\{[\s\S]*\}",t)
if not m: print(f"  {i}: sin JSON · leidas {len(ok)}/{len(urls)}"); sys.exit(0)
try: j=json.loads(m.group(0))
except Exception: print(f"  {i}: JSON invalido · leidas {len(ok)}/{len(urls)}"); sys.exit(0)
json.dump({"pedida":u,"leidas":ok,"datos":j},open(f"com-{i}.json","w"),ensure_ascii=False,indent=1)
g=lambda k: (j.get(k) or {}).get("v","?")
print(f"  {i}: leidas {len(ok)}/{len(urls)} · existe={j.get('programa_existe')} tipo={j.get('tipo')} · com={g('comision')} cookie={g('cookie')} esp={g('abierto_desde_espana')} negocios={g('promociona_producto_para_negocios')}")
PY
