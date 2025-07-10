import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormaPagoService, FormaPago } from '../../services/forma-pago.service';

@Component({
  selector: 'app-forma-pago',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forma-pago.component.html',
  styleUrl: './forma-pago.component.css'
})

export class FormaPagoComponent implements OnInit {
  formaPagoForm: FormGroup;
  tiposPago = ['EFECTIVO', 'TARJETA'];
  marcasTarjeta = ['VISA', 'MASTERCARD'];
  formasPago: FormaPago[] = [];
  editandoId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private formaPagoService: FormaPagoService
  ) {
    this.formaPagoForm = this.fb.group({
      tipo: ['', Validators.required],
      banco: [''],
      marcaTarjeta: [''],
      titular: [''],
      fechaCierre: [null],
      fechaVencimiento: [null],
      activo: [true]
    });

    // Escuchar cambios en el tipo de pago
    this.formaPagoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo === 'TARJETA') {
        this.formaPagoForm.get('banco')?.setValidators(Validators.required);
        this.formaPagoForm.get('marcaTarjeta')?.setValidators(Validators.required);
        this.formaPagoForm.get('titular')?.setValidators(Validators.required);
        this.formaPagoForm.get('fechaCierre')?.setValidators(Validators.required);
        this.formaPagoForm.get('fechaVencimiento')?.setValidators(Validators.required);
      } else {
        this.formaPagoForm.get('banco')?.clearValidators();
        this.formaPagoForm.get('marcaTarjeta')?.clearValidators();
        this.formaPagoForm.get('titular')?.clearValidators();
        this.formaPagoForm.get('fechaCierre')?.clearValidators();
        this.formaPagoForm.get('fechaVencimiento')?.clearValidators();
        // Limpiar los campos relacionados con tarjeta
        this.formaPagoForm.patchValue({
          banco: '',
          marcaTarjeta: '',
          titular: '',
          fechaCierre: null,
          fechaVencimiento: null
        });
      }
      this.formaPagoForm.get('banco')?.updateValueAndValidity();
      this.formaPagoForm.get('marcaTarjeta')?.updateValueAndValidity();
      this.formaPagoForm.get('titular')?.updateValueAndValidity();
      this.formaPagoForm.get('fechaCierre')?.updateValueAndValidity();
      this.formaPagoForm.get('fechaVencimiento')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.cargarFormasPago();
  }

  cargarFormasPago() {
    this.formaPagoService.obtenerFormasPago()
      .subscribe({
        next: (formas) => {
          // Separar EFECTIVO del resto
          const formasEfectivo = formas.filter(f => f.tipo === 'EFECTIVO');
          const formasTarjeta = formas.filter(f => f.tipo !== 'EFECTIVO');
          
          // Ordenar tarjetas por fecha de cierre (más reciente primero)
          formasTarjeta.sort((a, b) => {
            if (!a.fechaCierre && !b.fechaCierre) return 0;
            if (!a.fechaCierre) return 1;
            if (!b.fechaCierre) return -1;
            
            const fechaA = new Date(a.fechaCierre);
            const fechaB = new Date(b.fechaCierre);
            return fechaB.getTime() - fechaA.getTime(); // Orden descendente
          });
          
          // Combinar: EFECTIVO primero, luego tarjetas ordenadas
          this.formasPago = [...formasEfectivo, ...formasTarjeta];
          // console.log('Formas de pago cargadas:', this.formasPago);
        },
        error: (error) => {
          console.error('Error al cargar formas de pago:', error);
          alert('Error al cargar las formas de pago');
        }
      });
  }

  editarFormaPago(forma: FormaPago) {
    this.editandoId = forma.id!;
    this.formaPagoForm.patchValue(forma);
  }

  onSubmit() {
    if (this.formaPagoForm.valid) {
      console.log('Datos a enviar:', this.formaPagoForm.value); // Para ver qué datos estamos enviando

      if (this.editandoId) {
        // Actualizar forma de pago existente
        this.formaPagoService.actualizarFormaPago(this.editandoId, this.formaPagoForm.value).subscribe({
          next: (response) => {
            console.log('Forma de pago actualizada:', response);
            this.formaPagoForm.reset();
            this.editandoId = null;
            alert('Forma de pago actualizada exitosamente');
            this.cargarFormasPago();
          },
          error: (error) => {
            console.error('Error al actualizar forma de pago:', error);
            alert('Error al actualizar la forma de pago');
          }
        });
      } else {
        // Crear nueva forma de pago
        this.formaPagoService.crearFormaPago(this.formaPagoForm.value).subscribe({
          next: (response) => {
            console.log('Forma de pago creada:', response);
            this.formaPagoForm.reset();
            alert('Forma de pago creada exitosamente');
            this.cargarFormasPago();
          },
          error: (error) => {
            console.error('Error completo:', error);
            console.error('Mensaje del servidor:', error.error);
            console.error('Estado:', error.status);
            console.error('Detalles:', error.error?.message || error.message);
            
            alert(`Error al crear forma de pago: ${error.error?.message || 'Error en el servidor'}`);
          }
        });
      }
    }
  }

  eliminarFormaPago(id: number) {
    if (confirm('¿Está seguro de eliminar esta forma de pago?')) {
      this.formaPagoService.eliminarFormaPago(id)
        .subscribe({
          next: () => {
            alert('Forma de pago eliminada exitosamente');
            this.cargarFormasPago();
          },
          error: (error) => {
            console.error('Error al eliminar forma de pago:', error);
            alert('Error al eliminar la forma de pago');
          }
        });
    }
  }

  volverAlInicio() {
    this.router.navigate(['/']);
  }
}
