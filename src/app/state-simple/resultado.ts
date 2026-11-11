/** Lo que responde una entrada cuando se le pide una acción. */
export interface Resultado {
  /** `true` si la acción se pudo hacer y la entrada cambió (o se mantuvo) según lo esperado. */
  readonly ok: boolean;
  readonly mensaje: string;
}

/** Acciones que una persona puede pedirle a la entrada. */
export type Accion = 'reservar' | 'pagar' | 'cancelar' | 'entrar';

export const ACCIONES: readonly Accion[] = ['reservar', 'pagar', 'cancelar', 'entrar'];
