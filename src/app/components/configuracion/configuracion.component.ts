import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent {
  constructor(private router: Router) {}

  navegarA(ruta: string) {
    this.router.navigate([ruta]);
  }
}
