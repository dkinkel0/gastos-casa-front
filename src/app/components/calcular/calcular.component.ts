import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GastoPorMesService } from '../../services/gasto-por-mes.service';

@Component({
  selector: 'app-calcular',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calcular.component.html',
  styleUrl: './calcular.component.css'
})
export class CalcularComponent {
  /** Valor del input type="month" (yyyy-MM) */
  mesSeleccion = '';

  isRecalculandoHistorico = false;
  isCalculandoMes = false;

  constructor(
    private gastoPorMesService: GastoPorMesService,
    private router: Router
  ) {}

  recalcularHistorico(): void {
    if (this.isRecalculandoHistorico) {
      return;
    }
    this.isRecalculandoHistorico = true;
    this.gastoPorMesService.recalcularHistorico().subscribe({
      next: (response) => {
        alert(typeof response === 'string' ? response : 'Recálculo histórico completado');
        this.isRecalculandoHistorico = false;
      },
      error: (error) => {
        console.error('Error al recalcular histórico:', error);
        alert('Error al recalcular histórico. Verificá la consola o que el backend esté en marcha.');
        this.isRecalculandoHistorico = false;
      }
    });
  }

  calcularMesElegido(): void {
    if (!this.mesSeleccion || this.mesSeleccion.length < 7) {
      alert('Seleccioná un mes y año.');
      return;
    }
    if (this.isCalculandoMes) {
      return;
    }
    this.isCalculandoMes = true;
    this.gastoPorMesService.calcularMes(this.mesSeleccion).subscribe({
      next: (response) => {
        alert(typeof response === 'string' ? response : 'Cálculo del mes completado');
        this.isCalculandoMes = false;
      },
      error: (error) => {
        console.error('Error al calcular el mes:', error);
        const msg = error?.error && typeof error.error === 'string' ? error.error : 'Error al calcular el mes.';
        alert(msg);
        this.isCalculandoMes = false;
      }
    });
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }

  irVerHistorico(): void {
    this.router.navigate(['/ver-historico']);
  }
}
