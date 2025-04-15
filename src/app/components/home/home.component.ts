import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent {
  constructor(private router: Router) {}

  navegarA(ruta: string) {
    if (ruta === '/cotizacion-dolar' || ruta === '/configuracion') {
      this.router.navigate([ruta]);
    } else {
      alert('Funcionalidad en desarrollo');
    }
  }
}