import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
    private formaPagoService: FormaPagoService
  ) {
    this.formaPagoForm = this.fb.group({
      tipo: ['', Validators.required],
      banco: [''],
      marcaTarjeta: [''],
      diaCierre: [null],
      diaVencimiento: [null],
      activo: [true]
    });

    // Escuchar cambios en el tipo de pago
    this.formaPagoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo === 'TARJETA') {
        this.formaPagoForm.get('banco')?.setValidators(Validators.required);
        this.formaPagoForm.get('marcaTarjeta')?.setValidators(Validators.required);
        // Limpiar los campos de tarjeta cuando se cambia a EFECTIVO
      } else {
        this.formaPagoForm.get('banco')?.clearValidators();
        this.formaPagoForm.get('marcaTarjeta')?.clearValidators();
        // Limpiar los campos relacionados con tarjeta
        this.formaPagoForm.patchValue({
          banco: '',
          marcaTarjeta: '',
          diaCierre: null,
          diaVencimiento: null
        });
      }
      this.formaPagoForm.get('banco')?.updateValueAndValidity();
      this.formaPagoForm.get('marcaTarjeta')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.cargarFormasPago();
  }

  cargarFormasPago() {
    this.formaPagoService.obtenerFormasPago()
      .subscribe({
        next: (formas) => {
          this.formasPago = formas;
          console.log('Formas de pago cargadas:', formas);
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
      const formValue = this.formaPagoForm.value;
      if (formValue.diaCierre) {
        formValue.diaCierre = parseInt(formValue.diaCierre);
      }
      if (formValue.diaVencimiento) {
        formValue.diaVencimiento = parseInt(formValue.diaVencimiento);
      }

      const operacion = this.editandoId
        ? this.formaPagoService.actualizarFormaPago(this.editandoId, formValue)
        : this.formaPagoService.crearFormaPago(formValue);

      operacion.subscribe({
        next: (response) => {
          console.log(this.editandoId ? 'Forma de pago actualizada:' : 'Forma de pago creada:', response);
          this.formaPagoForm.reset({activo: true});
          this.editandoId = null;
          alert(this.editandoId ? 'Forma de pago actualizada exitosamente' : 'Forma de pago creada exitosamente');
          this.cargarFormasPago();
        },
        error: (error) => {
          console.error('Error:', error);
          alert('Error al procesar la forma de pago');
        }
      });
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
}
