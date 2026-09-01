# Atlas

Atlas es un asesor inteligente que ayuda a las empresas a elegir la mejor
tecnología para crecer. No es un blog ni un directorio: pregunta al usuario
qué quiere mejorar y le recomienda las mejores soluciones.

## Objetivo del MVP

En menos de 60 segundos un usuario puede:

1. Elegir un problema.
2. Ver las mejores herramientas.
3. Compararlas.
4. Ir a la web oficial de la herramienta.

## Flujo

```
Inicio → Seleccionar problema → Seleccionar categoría → Comparar herramientas → Ir al proveedor
```

## Identidad de marca

El color principal de Molnip es **`#6E5FE4`** y está **congelado**: no se
modifica sin aprobación explícita de la propietaria.

La identidad visual completa —paleta, significado de cada color, tipografía,
forma y las comprobaciones que lo sostienen— está en
**[`brand-guidelines.md`](./brand-guidelines.md)**.

Todos los colores son tokens de `app/globals.css`. Ningún componente escribe un
color a mano; hay pruebas que fallan si alguien lo intenta.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `lib/data.ts` — contenido: problemas, categorías y herramientas comparadas.
- `app/page.tsx` — paso 1, selección de problema.
- `app/problema/[problemaId]/page.tsx` — paso 2, selección de categoría.
- `app/problema/[problemaId]/[categoriaId]/page.tsx` — paso 3, comparativa y enlace al proveedor.
- `components/` — cabecera, indicador de pasos y valoración por estrellas.
