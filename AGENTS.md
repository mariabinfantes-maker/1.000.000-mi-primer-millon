<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# La marca de Molnip

El color principal es **`#6E5FE4`**. Está **congelado**: no se cambia sin
aprobación explícita de la propietaria, y hay una prueba que falla si cambia.

Antes de tocar cualquier color, lee **`brand-guidelines.md`**. Los colores son
tokens de `app/globals.css` (y `lib/marca/paleta.ts` para lo que no puede leer
CSS). **No escribas ningún color a mano en una página o componente**: hay
pruebas que lo impiden, y existen porque la portada ya se quedó semanas con un
índigo viejo por escribirlo como texto en vez de usar el token.
