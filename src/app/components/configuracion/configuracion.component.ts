import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GastoPorMesService } from '../../services/gasto-por-mes.service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent {
  isCalculando = false;

  constructor(
    private router: Router,
    private gastoPorMesService: GastoPorMesService
  ) {}

  navegarA(ruta: string) {
    this.router.navigate([ruta]);
  }

  recalcularHistorico() {
    if (this.isCalculando) {
      return; // Evitar múltiples clics
    }

    this.isCalculando = true;
    
    this.gastoPorMesService.recalcularHistorico().subscribe({
      next: (response) => {
        console.log('Recálculo histórico completado:', response);
        alert('Recálculo histórico completado exitosamente');
        this.isCalculando = false;
      },
      error: (error) => {
        console.error('Error al recalcular histórico:', error);
        alert('Error al recalcular histórico. Verifica la consola para más detalles.');
        this.isCalculando = false;
      }
    });
  }
}
