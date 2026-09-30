# Encargo: herramientas con agenda por profesional

Copia todo lo que hay debajo de la línea y pégalo en GPT con navegación activada.

---

Eres un investigador. Tu trabajo es reunir **evidencia**, no opiniones. Necesito
que navegues de verdad y que cada dato venga con la frase literal que lo
demuestra y la dirección donde la leíste.

## Qué busco

Herramientas que permitan las dos cosas a la vez:

1. **Agenda separada por profesional o por recurso.** Que cada persona del
   equipo —o cada sala, sillón, box o máquina— tenga su propia agenda, con sus
   horarios y sus servicios.
2. **Que quien reserva elija con quién.** Que el cliente o el paciente vea a los
   profesionales y escoja con cuál quiere la cita.

## Qué NO cuenta

No lo des por bueno si sólo encuentras esto:

- El calendario personal de un usuario para organizar su día.
- Repartir reuniones por turnos entre comerciales (*round robin*): ahí el
  cliente no elige, se le asigna.
- Reservar salas o equipos entre compañeros de la empresa.
- Una única página de reservas para todo el negocio, sin distinguir personas.

## Dónde mirar

Busca en los dos mundos y dime siempre de cuál sale cada herramienta:

- **Herramientas españolas o hechas para el mercado hispanohablante** —España y
  América Latina—, incluidas las que casi no se conocen fuera: programas de
  gestión de clínicas, de centros de estética, de peluquerías, de fisioterapia,
  de veterinarias, de talleres, de academias, de asesorías.
- **Herramientas internacionales en inglés**, aunque no tengan versión en
  español. Si no está en español, dímelo; no la descartes por eso.

Mira también fuera de lo obvio: además de los sistemas de reservas conocidos,
hay programas verticales por oficio que hacen esto mejor que los generalistas.

## Cómo tienes que trabajar

- **Abre las páginas.** No respondas de memoria ni de lo que recuerdes de un
  producto. Si no has abierto la página, no lo has comprobado.
- **Sólo vale la palabra del fabricante**: su web, su documentación, su centro
  de ayuda, sus tutoriales o su documentación técnica. **No valen** blogs
  ajenos, comparadores, directorios de software ni opiniones de usuarios.
- **Cada «sí» necesita una cita literal**, copiada tal cual, con su dirección.
  Sin cita no hay «sí».
- **No deduzcas.** Si la página no lo dice, no lo dice.
- Si una página no se abre —bloqueo, error, contenido que no carga—, **dilo**.
  No lo conviertas en un «no lo tiene».

## La distinción que más me importa

Quiero tres estados, nunca dos:

- `verificado` — abriste la página y lo dice. Va con su cita.
- `no_encontrado` — abriste la página y no lo dice. **No significa que la
  herramienta no lo tenga**: significa que no lo has encontrado.
- `no_pude_mirar` — no conseguiste abrir ninguna página útil. No dice nada del
  producto.

Nunca escribas «no lo tiene» a menos que el fabricante lo diga con esas
palabras. Si lo dice, pon la cita.

## Cuántas

**No te pares en la primera que funcione.** Quiero una lista amplia: revisa al
menos **30 candidatas** y devuélvemelas todas, también las que se quedan en
`no_encontrado` o `no_pude_mirar`, para saber qué queda por mirar.

## Qué NO quiero

- **Nada sobre programas de afiliados, comisiones ni enlaces de referido.** No
  lo investigues y no lo menciones.
- **Ni notas, ni puntuaciones, ni rankings, ni «ventajas y desventajas».** No
  estamos juzgando herramientas.
- Si una herramienta no encaja para cierto negocio, dilo así: **para quién está
  pensada y para quién no**. No digas que es mala.

## Cómo quiero la respuesta

Primero, en tres o cuatro líneas: cuántas miraste, cuántas quedaron
verificadas, y qué te ha bloqueado.

Después, **sólo este JSON**, sin nada alrededor:

```json
{
  "fecha": "AAAA-MM-DD",
  "cuantasRevisadas": 0,
  "herramientas": [
    {
      "nombre": "",
      "web": "https://",
      "deDonde": "espana | latinoamerica | internacional",
      "idiomaDelProducto": ["es", "en"],
      "paraQuienEstaPensada": "Una frase. Qué tipo de negocio la usa.",
      "paraQuienNoEstaPensada": "Una frase. Sin juzgarla.",
      "esDirectorioOProgramaPropio": "directorio | programa propio | las dos cosas",

      "agendaPorProfesional": {
        "estado": "verificado | no_encontrado | no_pude_mirar",
        "cita": "frase literal copiada de la página, o null",
        "url": "https://... , o null"
      },
      "eligeElCliente": {
        "estado": "verificado | no_encontrado | no_pude_mirar",
        "cita": "",
        "url": ""
      },
      "precioMasBajo": {
        "estado": "verificado | no_encontrado | no_pude_mirar",
        "cita": "lo que dice la página de precios, tal cual",
        "moneda": "EUR | USD | otra",
        "url": ""
      },

      "paginasQueAbriste": ["https://", "https://"],
      "paginasQueNoSeAbrieron": ["https://"],
      "loQueNoSePudoComprobar": "Qué te falta y por qué."
    }
  ],
  "candidatasQueNoDioTiempo": ["nombre", "nombre"]
}
```

Una advertencia final, por experiencia: hay webs cuyo bloque de reservas **no
se carga** para un lector automático y siempre muestra el mismo mensaje de «no
hay reserva online», tenga el negocio la reserva activada o no. Si ves el mismo
texto repetido en varias fichas distintas, sospecha y búscalo por otro lado —
la documentación técnica suele ser el sitio donde sí está escrito.
