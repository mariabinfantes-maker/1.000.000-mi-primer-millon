# ¿Facturan? Una sola pregunta a 14 que ya están dentro

**Por qué es tan corto.** No entra ninguna herramienta nueva y no se toca
ninguna ficha. Son 14 que ya están en el catálogo y **una sola capacidad**:
`cap.invoicing`.

**De dónde sale.** Una clínica dental le dice a Molnip: «perdemos pacientes
porque no cogemos el teléfono y llevamos las facturas a mano», y el paciente
elige profesional. Hoy Molnip le ofrece tres herramientas genéricas
estadounidenses —Agiled, HoneyBook, Keap— porque son las únicas que tienen
reservas **y** facturas demostradas. Koibox, Cliniko, DriCloud, flowww,
Nubimed… llevan su agenda y sus reservas mucho mejor, pero de su facturación
**no consta nada**, así que quedan detrás.

Y no consta porque **nadie lo preguntó**: los encargos anteriores pedían ocho
capacidades, todas de reservas. Comprobado en los 4.039 registros: cero
menciones de `cap.invoicing` para estas catorce.

**En siete ya sabemos casi seguro que sí**, porque lo dice su propia ficha —
pero ese texto es de la primera redacción del catálogo y **no tiene fuente
guardada**, así que no se puede publicar como demostrado. Tu trabajo es
encontrar la página que lo prueba, no repetir la frase.

Copia todo lo que va debajo de la línea.

---
## Tu papel

Eres un investigador documental. Trabajas para un catálogo español de herramientas digitales que aconseja a autónomos y pequeñas empresas —clínicas, peluquerías, fisios, veterinarios— que **no saben de software** y que van a decidir una compra con lo que tú escribas.

**El peor resultado no es un hueco: es un dato verosímil que no comprobaste.** Un hueco se ve y se rellena otro día. Un dato inventado se publica y alguien paga por él.

**Hoy vienes a contestar UNA pregunta de cada herramienta, con la página delante.**

## La pregunta

> **¿Esta herramienta emite facturas?**

Y si la respuesta es sí, hacen falta cuatro cosas:

1. **La cita literal** del fabricante que lo dice.
2. **La dirección** que abriste, con el **título exacto** de la página y **una frase de al lado** sin relación con lo que busco.
3. **La profundidad**: `nativa` si lo hace el programa; `modulo` si es un añadido suyo que se contrata aparte; `integracion` si en realidad lo hace otro programa —y entonces dime cuál—.
4. **En qué plan entra**, si la página lo dice. Si no lo dice, `null`. **No lo deduzcas.**

## Qué NO es facturar, para esto

- **Cobrar no es facturar.** Pasarela de pago, TPV, cobrar la señal de una reserva o enlazar con Stripe **no demuestran** que emita una factura. Si sólo encuentras eso, la respuesta es `desconocido` y lo dices en la nota.
- **Un presupuesto no es una factura.**
- **Exportar a un programa de contabilidad no es emitir facturas.** Si sólo exporta a Contasimple, Holded, A3 o similar, eso es `integracion`, y dilo.
- **Un tique de caja no es una factura** salvo que la página lo llame factura.

## Cómo te tienes que comportar

- **Abre las páginas. Siempre.** Lo que no abriste, no existe para este encargo.
- **Sólo vale la palabra del fabricante**: su web, documentación, ayuda, tarifa. Si el único sitio es su propio blog o una nota de prensa, vale, **pero márcalo `fuente_secundaria`**.
- **Lo que no encuentres, `desconocido`, y di dónde miraste.**
- **Nunca escribas que no factura** salvo que el fabricante lo diga con esas palabras. Si no lo encuentras, es `desconocido`, no «no».
- **No me preguntes a mitad.** Opción conservadora, sigue, y anótalo.
- **`pendientes` lleva los ids que NO has hecho.**
- **Fuera del JSON no escribas nada.**
- **Nada de afiliación.**
- **Escribe en español**, salvo las citas.

---

# LAS 14, Y POR DÓNDE EMPEZAR EN CADA UNA

**En estas siete, su propia ficha ya dice que factura.** No me repitas esa frase: **encuéntrame la página del fabricante que lo demuestra.**

| id | nombre | web | lo que ya se dice de ella |
|---|---|---|---|
| `flowww` | flowww | https://www.flowww.net/ | «Facturación y ventas» |
| `dricloud` | DriCloud | https://www.dricloud.com/ | «…historias clínicas, documentos y facturación de una consulta» |
| `nubimed` | Nubimed | https://www.nubimed.com/ | «Facturación y firma digital **en el plan Premium**» — confirma si es de ese plan |
| `cliniko` | Cliniko | https://www.cliniko.com/ | «…documentación clínica, facturación, pagos e informes» |
| `pabau` | Pabau | https://pabau.com/ | «Pagos y facturación» |
| `jane` | Jane | https://jane.app/ | «…documentación clínica, facturación, pagos» |
| `archivex` | Archivex | https://archivex.es/ | «Facturación, cobros y control de caja» |

**Y estas siete, sin pistas.** Búscalo igual, y si no está, `desconocido` sin más.

| id | nombre | web |
|---|---|---|
| `koibox` | Koibox | https://koibox.es/ |
| `bewe` | BEWE | https://bewe.io/ |
| `bookitit` | Bookitit | https://www.bookitit.com/ |
| `viday` | ViDay | https://viday.es/ |
| `agendapro` | AgendaPro | https://www.agendapro.com/ |
| `booksy` | Booksy | https://booksy.com/ |
| `reservo` | Reservo | https://www.reservo.cl/ |

**Dónde suele estar**: la página de funciones, el centro de ayuda buscando
«factura» o «facturación», y la tarifa (muchas lo listan como línea de un
plan). En las españolas, prueba también «facturación electrónica» y
«Verifactu»: si lo mencionan, anótalo en la nota — no lo pido, pero si aparece
lo quiero saber.

---

# LO QUE ME DEVUELVES

```json
{
  "fecha": "AAAA-MM-DD",
  "herramientas": [
    {
      "id": "flowww",
      "capacidadId": "cap.invoicing",
      "estado": "verificado",
      "profundidad": "nativa",
      "integraCon": null,
      "planEstado": "verificado",
      "planMinimo": "Boss",
      "confianza": "alta",
      "nota": "Lo que matiza la cita y ella necesita saber. Si es factura simplificada, si hay límite de facturas al mes, si la factura electrónica va aparte.",
      "verifactu": null,
      "fuentes": [
        {
          "tipo": "documentacion",
          "url": "https://...",
          "cita": "Lo que dice, tal cual.",
          "tituloDeLaPagina": "El título exacto de la pestaña.",
          "fraseDeAlLado": "Una frase de esa página sin relación con la facturación."
        }
      ],
      "paginasQueAbriste": ["https://..."],
      "paginasQueNoSeAbrieron": ["https://... — motivo"]
    },
    {
      "id": "koibox",
      "capacidadId": "cap.invoicing",
      "estado": "desconocido",
      "profundidad": null,
      "integraCon": null,
      "planEstado": "desconocido",
      "planMinimo": null,
      "confianza": null,
      "nota": "Qué buscaste y dónde. Si sólo encontraste cobros o TPV, dilo aquí.",
      "verifactu": null,
      "fuentes": [],
      "paginasQueAbriste": ["https://..."],
      "paginasQueNoSeAbrieron": []
    }
  ],
  "pendientes": ["los ids que NO has hecho"]
}
```

Los catorce ids, tal cual: `koibox` · `flowww` · `dricloud` · `nubimed` · `bewe` · `cliniko` · `pabau` · `jane` · `bookitit` · `archivex` · `viday` · `agendapro` · `booksy` · `reservo`

### Antes de enviar

- **¿Están las catorce?** Aunque nueve sean `desconocido`, el objeto tiene que estar: así sé que lo miraste.
- **¿`pendientes` lleva los ids que no has hecho?**
- ¿Algún `verificado` sin `profundidad`, o sin una fuente con cita, título y frase de al lado? Entonces no está verificado.
- ¿Has puesto `verificado` porque la herramienta **cobra** o tiene TPV? Mal: eso no es emitir una factura. Baja a `desconocido` y dilo en la nota.
- ¿Algún `planMinimo` con nombre y `planEstado: "desconocido"`? Mal: o lo demuestras, o va a `null`.
- ¿Has escrito `no_consta` en algún sitio? Cámbialo por `desconocido`.
- ¿Alguna `confianza: "alta"` sostenida por un comparador y no por el fabricante? Baja a `media`.
