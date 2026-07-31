/**
 * Generación y validación del `id` (slug) de una herramienta.
 *
 * Es una función pura de texto, sin acceso a disco: no sabe qué ids existen
 * ya en `data/herramientas/` ni en `data/borradores/` — eso se lo pasa quien
 * llame (`lote.ts`), leyendo del repositorio correspondiente. Mantenerlo
 * puro es lo que permite probarlo por completo sin tocar el sistema de
 * archivos, igual que `prompt.ts` o `validador.ts`.
 *
 * El formato replica el de los ids ya existentes en `data/herramientas/`
 * (ej. "hubspot", "zoho-one"): kebab-case, minúsculas, sin acentos.
 */

/**
 * Normaliza un nombre de herramienta (tal y como lo escribiría un usuario o
 * lo devolvería un proveedor de IA) a un slug estable.
 *
 * "Zoho One" → "zoho-one", "HubSpot!" → "hubspot", "Odoo (ERP)" → "odoo-erp".
 */
export function generarId(nombreHerramienta: string): string {
  return nombreHerramienta
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos/diacríticos tras la descomposición NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Comprueba que un id ya generado tenga la forma esperada (kebab-case, sin vacíos ni guiones sueltos). */
export function idEsValido(id: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
}

/** ¿Ese id ya está en uso? `idsExistentes` lo aporta quien llama (catálogo real, borradores, o ambos combinados). */
export function idYaExiste(id: string, idsExistentes: Iterable<string>): boolean {
  for (const existente of idsExistentes) {
    if (existente === id) return true;
  }
  return false;
}
