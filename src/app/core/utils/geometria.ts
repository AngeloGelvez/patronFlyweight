/**
 * Devuelve el elemento más cercano a (x, y) que esté dentro de `radio`, o
 * `null` si no hay ninguno.
 */
export function buscarMasCercano<T extends { readonly x: number; readonly y: number }>(
  elementos: readonly T[],
  x: number,
  y: number,
  radio: number,
): T | null {
  let masCercano: T | null = null;
  let menorDistancia = radio * radio;

  for (const elemento of elementos) {
    const dx = elemento.x - x;
    const dy = elemento.y - y;
    const distancia = dx * dx + dy * dy;

    if (distancia <= menorDistancia) {
      menorDistancia = distancia;
      masCercano = elemento;
    }
  }

  return masCercano;
}
