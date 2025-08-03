import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GastoPorMesService {
  private baseUrl = 'http://localhost:8585/api/gastos-por-mes';

  constructor(private http: HttpClient) { }

  /**
   * Recalcula todo el histórico de gastos por mes
   * @returns Observable con el resultado de la operación
   */
  recalcularHistorico(): Observable<any> {
    return this.http.post(`${this.baseUrl}/recalcular-historico`, {}, { responseType: 'text' });
  }

  /**
   * Calcula solo el mes actual
   * @returns Observable con el resultado de la operación
   */
  calcularMesActual(): Observable<any> {
    return this.http.post(`${this.baseUrl}/calcular-mes-actual`, {}, { responseType: 'text' });
  }

  /**
   * Obtiene los gastos por mes para un mes específico
   * @param mesAño formato "2024-01"
   * @returns Observable con la lista de gastos por mes
   */
  obtenerGastosPorMes(mesAño: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/mes/${mesAño}`);
  }

  /**
   * Obtiene los gastos por mes para un rango de meses
   * @param meses lista de meses en formato "2024-01"
   * @returns Observable con la lista de gastos por mes
   */
  obtenerGastosPorRangoMeses(meses: string[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/rango-meses`, { meses });
  }
} 