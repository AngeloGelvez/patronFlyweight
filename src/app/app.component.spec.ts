import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('crea la aplicación', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('enlaza los dos ejemplos del patrón State', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const enlaces = (fixture.nativeElement as HTMLElement).querySelectorAll('nav[aria-label="Ejemplo"] a');
    expect(Array.from(enlaces).map((a) => a.getAttribute('href'))).toEqual([
      '/patronState/simple',
      '/patronState/observer',
    ]);
  });
});
