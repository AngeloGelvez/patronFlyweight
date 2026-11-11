/** Entradas que se pueden meter al carrito (datos de ejemplo). */
export interface ItemEntrada {
  readonly nombre: string;
  /** Precio en euros. */
  readonly precio: number;
}

export const CATALOGO: readonly ItemEntrada[] = [
  { nombre: 'Fondo Norte', precio: 45 },
  { nombre: 'Lateral Este', precio: 85 },
  { nombre: 'Preferencia', precio: 150 },
  { nombre: 'VIP', precio: 280 },
];

/** Máximo de entradas por pedido (regla de negocio que aplica el estado En carrito). */
export const MAX_ENTRADAS_POR_PEDIDO = 4;
/** Intentos de pago permitidos antes de cancelar el pedido. */
export const MAX_PAGOS_RECHAZADOS = 3;
/** Días mínimos antes del partido para poder pedir un reembolso. */
export const DIAS_MINIMOS_REEMBOLSO = 7;
