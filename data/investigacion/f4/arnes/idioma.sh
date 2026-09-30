#!/bin/bash
# Pregunta expresamente por el idioma del PRODUCTO, no de la web.
ID="$1"; NOMBRE="$2"; U="$3"
PROMPT="Lee esta pagina oficial de \"$NOMBRE\": $U
Pregunta unica: ¿dice la pagina que el PRODUCTO o su INTERFAZ esten disponibles en espanol? Una web traducida NO basta: busca menciones a idiomas del software, seleccion de idioma del producto, soporte en espanol, o presencia comercial en Espana.
Si la pagina no lo dice, pon \"no_consta\". NUNCA digas que no lo tiene.
Devuelve SOLO este JSON: {\"producto_en_espanol\":\"si|no_consta\",\"cita\":\"\",\"idiomas_mencionados\":\"\",\"espana_mencionada\":\"si|no_consta\",\"cita_espana\":\"\"}"
jq -n --arg p "$PROMPT" '{contents:[{parts:[{text:$p}]}],tools:[{url_context:{}}],generationConfig:{temperature:0,maxOutputTokens:6000,thinkingConfig:{thinkingBudget:1024}}}' > "qi-$ID.json"
for i in 1 2 3 4; do
  curl -sS --max-time 240 -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" -H "Content-Type: application/json" -d @"qi-$ID.json" > "ri-$ID.json"
  [ "$(wc -c < "ri-$ID.json")" -gt 200 ] && break; sleep $((i*6))
done
rm -f "qi-$ID.json"
python3 - "$ID" "$U" <<'PY'
import json,sys,re
i,u=sys.argv[1],sys.argv[2]
try: d=json.load(open(f"ri-{i}.json"))
except Exception: print(f"  {i}/idioma: CORTE"); sys.exit(0)
if "error" in d: print(f"  {i}/idioma: ERROR {d['error'].get('code')}"); sys.exit(0)
c=d["candidates"][0]
urls=[(m.get("retrievedUrl",""),m.get("urlRetrievalStatus","")) for m in c.get("urlContextMetadata",{}).get("urlMetadata",[])]
ok=[r for r,s in urls if s=="URL_RETRIEVAL_STATUS_SUCCESS"]
t="".join(x.get("text","") for x in c.get("content",{}).get("parts",[]))
m=re.search(r"\{[\s\S]*\}",t)
if not m: print(f"  {i}/idioma: sin JSON, leidas {len(ok)}/{len(urls)}"); sys.exit(0)
j=json.loads(m.group(0))
json.dump({"pedida":u,"urls":urls,"datos":j},open(f"idioma-{i}.json","w"),ensure_ascii=False,indent=1)
print(f"  {i}/idioma: leidas {len(ok)}/{len(urls)} · producto_es={j.get('producto_en_espanol')} · espana={j.get('espana_mencionada')}")
print(f"     idiomas: {str(j.get('idiomas_mencionados'))[:120]}")
PY
