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

  it('enlaza las dos versiones del mapa', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const enlaces = (fixture.nativeElement as HTMLElement).querySelectorAll('nav a');

    expect(Array.from(enlaces).map((a) => a.getAttribute('href'))).toEqual(['/antes', '/despues']);
  });
});
