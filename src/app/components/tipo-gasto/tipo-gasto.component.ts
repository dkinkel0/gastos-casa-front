import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoGastoService } from '../../services/tipo-gasto.service';

@Component({
  selector: 'app-tipo-gasto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-gasto.component.html',
  styleUrl: './tipo-gasto.component.css'
})
export class TipoGastoComponent implements OnInit {
  tiposGasto: any[] = [];
  nuevoTipoGasto: any = {
    nombre: '',
    descripcion: ''
  };
  editando: boolean = false;

  constructor(private tipoGastoService: TipoGastoService) { }

  ngOnInit(): void {
    this.cargarTiposGasto();
  }

  cargarTiposGasto(): void {
    this.tipoGastoService.getTiposGasto().subscribe({
      next: (data: any) => {
        this.tiposGasto = data;
      },
      error: (error: any) => {
        console.error('Error al cargar tipos de gasto:', error);
      }
    });
  }

  guardarTipoGasto(): void {
    if (this.nuevoTipoGasto.nombre.trim()) {
      if (this.editando) {
        this.tipoGastoService.createTipoGasto(this.nuevoTipoGasto).subscribe({
          next: () => {
            this.cargarTiposGasto();
            this.limpiarFormulario();
          },
          error: (error: any) => {
            console.error('Error al actualizar tipo de gasto:', error);
          }
        });
      } else {
        this.tipoGastoService.createTipoGasto(this.nuevoTipoGasto).subscribe({
          next: () => {
            this.cargarTiposGasto();
            this.limpiarFormulario();
          },
          error: (error: any) => {
            console.error('Error al agregar tipo de gasto:', error);
          }
        });
      }
    }
  }

  editarTipoGasto(tipo: any): void {
    this.editando = true;
    this.nuevoTipoGasto = { ...tipo };
  }

  limpiarFormulario(): void {
    this.editando = false;
    this.nuevoTipoGasto = {
      nombre: '',
      descripcion: ''
    };
  }

  eliminarTipoGasto(id: number): void {
    this.tipoGastoService.deleteTipoGasto(id).subscribe({
      next: () => {
        this.cargarTiposGasto();
      },
      error: (error: any) => {
        console.error('Error al eliminar tipo de gasto:', error);
      }
    });
  }
}
