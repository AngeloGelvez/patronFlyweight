import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('crea la aplicación', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  /** Devuelve los destinos de los enlaces de una barra de navegación. */
  function destinos(selector: string): (string | null)[] {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const enlaces = (fixture.nativeElement as HTMLElement).querySelectorAll(`${selector} a`);
    return Array.from(enlaces).map((enlace) => enlace.getAttribute('href'));
  }

  it('enlaza los dos patrones', () => {
    expect(destinos('nav[aria-label="Patrón"]')).toEqual([
      '/patronFlyweight/antes',
      '/patronBridge',
    ]);
  });

  it('enlaza las dos versiones del mapa fuera de la ruta de Bridge', () => {
    expect(destinos('nav[aria-label="Implementación del mapa"]')).toEqual([
      '/patronFlyweight/antes',
      '/patronFlyweight/despues',
    ]);
  });
});
