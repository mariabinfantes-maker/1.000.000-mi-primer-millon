import json, glob, os
CAND={c["id"]:c["nombre"] for c in json.load(open("candidatas.json"))}
ESEN=["reserva_online_cliente","recordatorios_automaticos","cancelar_o_cambiar_cita","ficha_de_cliente","catalogo_de_servicios"]
COND=["agenda_por_profesional","cobro_online","tpv_mostrador","senal_o_politica_ausencias","bonos_packs_sesiones","comisiones_o_propinas","widget_reserva_en_web_propia","inventario_stock"]
OTROS=["precio","ficha_tecnica_servicio"]
res={}
for f in sorted(glob.glob("ok-*.json")):
    base=os.path.basename(f)[3:-5]
    cid,et=base.rsplit("-",1)
    d=json.load(open(f)); j=d["datos"]
    r=res.setdefault(cid,{"paginas":[],"campos":{},"citas":{},"meta":{}})
    leidas=[u for u,s in d["urls"] if s=="URL_RETRIEVAL_STATUS_SUCCESS"]
    r["paginas"].append((et,d["pedida"],leidas))
    for k in ("idioma_es","espana","tipo_producto"):
        v=j.get(k)
        if v and v!="no_consta": r["meta"][k]=v
    for k in ESEN+COND+OTROS:
        v=j.get(k)
        if isinstance(v,dict) and v.get("v")=="si":
            r["campos"][k]="si"; r["citas"].setdefault(k,(et,v.get("cita","")))
print(f"{'candidata':<16}{'es':>4}{'tipo':>13}{'esen':>6}{'cond':>6}{'precio':>8}{'ficha':>7}  páginas leídas")
for cid in CAND:
    r=res.get(cid)
    if not r: print(f"{CAND[cid]:<16}{'—':>4}{'sin datos':>13}"); continue
    e=sum(1 for k in ESEN if r["campos"].get(k)=="si")
    c=sum(1 for k in COND if r["campos"].get(k)=="si")
    ok=sum(1 for _,_,l in r["paginas"] if l)
    print(f"{CAND[cid]:<16}{r['meta'].get('idioma_es','?'):>4}{r['meta'].get('tipo_producto','no_consta'):>13}{e:>5}/5{c:>5}/8{r['campos'].get('precio','no'):>8}{r['campos'].get('ficha_tecnica_servicio','no'):>7}  {ok}/{len(r['paginas'])}")
json.dump(res,open("consolidado.json","w"),ensure_ascii=False,indent=1)
