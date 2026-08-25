/**
 * Nombres de cookie del panel interno, centralizados para que
 * `middleware.ts`, las rutas de API y el login usen exactamente el mismo
 * literal — un typo en un solo sitio no debe romper la autenticación en
 * silencio.
 */
export const COOKIE_SESION = "molnip_admin_sesion";
export const COOKIE_CSRF = "molnip_admin_csrf";
export const COOKIE_INTENTOS = "molnip_admin_intentos";
