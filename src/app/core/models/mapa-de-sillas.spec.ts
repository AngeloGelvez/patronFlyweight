import { EstadioSinFlyweight } from '../../antes/estadio-sin-flyweight';
import { EstadioConFlyweight } from '../../despues/estadio-con-flyweight';
import { generarEstadio, SillaRegistro } from '../data/estadio.generator';
import { MapaDeSillas } from './mapa-de-sillas';

/** Las dos primeras sillas de una zona en el plano. */
function dosSillasDeLaZona(sillas: readonly SillaRegistro[]): [SillaRegistro, SillaRegistro] {
  const deVip = sillas.filter((s) => s.zona === 'VIP');
  return [deVip[0], deVip[1]];
}

function seleccionarVista(mapa: MapaDeSillas, silla: SillaRegistro) {
  const seleccionada = mapa.seleccionarSilla(silla.x, silla.y);
  if (!seleccionada) throw new Error(`No se encontró la silla ${silla.id}`);
  expect(seleccionada.detalle.id).toBe(silla.id);
  return seleccionada.obtenerVista();
}

describe('Vistas previas de las dos versiones del mapa', () => {
  const plano = generarEstadio(2_000);
  const [primera, segunda] = dosSillasDeLaZona(plano.sillas);

  it('sin Flyweight dibuja una vista nueva por cada silla, aunque sea la misma zona', () => {
    const mapa = new EstadioSinFlyweight(plano);

    const vistaA = seleccionarVista(mapa, primera);
    const vistaB = seleccionarVista(mapa, segunda);

    expect(vistaB).not.toBe(vistaA);
    expect(mapa.estadisticas().vistasRenderizadas).toBe(2);
  });

  it('sin Flyweight, una misma silla reutiliza su propia vista', () => {
    const mapa = new EstadioSinFlyweight(plano);

    expect(seleccionarVista(mapa, primera)).toBe(seleccionarVista(mapa, primera));
    expect(mapa.estadisticas().vistasRenderizadas).toBe(1);
  });

  it('con Flyweight todas las sillas de la zona comparten la misma vista', () => {
    const mapa = new EstadioConFlyweight(plano);

    const vistaA = seleccionarVista(mapa, primera);
    const vistaB = seleccionarVista(mapa, segunda);

    expect(vistaB).toBe(vistaA);
    expect(mapa.estadisticas().vistasRenderizadas).toBe(1);
  });
});
