import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GastoService } from '../../services/gasto.service';

@Component({
  selector: 'app-gasto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gasto.component.html',
  styleUrl: './gasto.component.css'
})
export class GastoComponent implements OnInit {
  gastoForm: FormGroup;
  tiposGasto: any[] = []; // Aquí cargaremos los tipos de gasto
  formasPago: any[] = []; // Aquí cargaremos las formas de pago

  constructor(
    private fb: FormBuilder,
    private gastoService: GastoService
  ) {
    this.gastoForm = this.fb.group({
      fecha: ['', Validators.required],
      detalle: ['', Validators.required],
      tipo: ['', Validators.required],
      costo: ['', [Validators.required, Validators.min(0)]],
      costoDolar: [''],
      formaPago: ['', Validators.required],
      cuotas: ['']
    });
  }

  ngOnInit() {
    // Aquí deberías cargar los tipos de gasto y formas de pago desde el backend
    this.cargarTiposGasto();
    this.cargarFormasPago();
  }

  cargarTiposGasto() {
    // Implementar llamada al servicio para obtener tipos de gasto
  }

  cargarFormasPago() {
    // Implementar llamada al servicio para obtener formas de pago
  }

  onSubmit() {
    if (this.gastoForm.valid) {
      console.log('Enviando datos:', this.gastoForm.value);
      this.gastoService.crearGasto(this.gastoForm.value).subscribe({
        next: (response) => {
          console.log('Gasto guardado exitosamente', response);
          this.gastoForm.reset();
          alert('Gasto guardado exitosamente');
        },
        error: (error) => {
          console.error('Error al guardar el gasto:', error);
          alert('Error al guardar el gasto: ' + (error.error?.message || 'Error desconocido'));
        }
      });
    }
  }
}
