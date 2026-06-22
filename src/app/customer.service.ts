import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, delay, map, of, tap, throwError } from 'rxjs';
import { Customer, CustomerPage, CustomerPayload } from './customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly apiUrl = 'assets/customers.json';
  private readonly customersSubject = new BehaviorSubject<Customer[]>([]);
  private customers: Customer[] = [];

  readonly customers$ = this.customersSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadFromApi(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl).pipe(
      tap(customers => {
        this.customers = customers;
        this.emitCustomers();
      }),
      catchError(() => {
        this.emitCustomers();
        return of(this.customers);
      })
    );
  }

  getPage(pageIndex: number, pageSize: number): Observable<CustomerPage> {
    const start = (pageIndex - 1) * pageSize;
    const data = this.customers.slice(start, start + pageSize);

    return of({
      data,
      total: this.customers.length,
      pageIndex,
      pageSize
    }).pipe(delay(120));
  }

  isCodeTaken(code: string, ignoreId?: number): boolean {
    const normalizedCode = code.trim().toLowerCase();

    return this.customers.some(customer => {
      return customer.id !== ignoreId && customer.code.trim().toLowerCase() === normalizedCode;
    });
  }

  addCustomer(payload: CustomerPayload): Observable<Customer> {
    const nextId = Math.max(0, ...this.customers.map(customer => customer.id)) + 1;
    const customer = { id: nextId, ...payload };

    this.customers = this.sortById([...this.customers, customer]);
    this.emitCustomers();

    return of(customer).pipe(delay(120));
  }

  updateCustomer(id: number, payload: CustomerPayload): Observable<Customer> {
    const currentCustomer = this.customers.find(customer => customer.id === id);

    if (!currentCustomer) {
      return throwError(() => new Error('Khong tim thay khach hang'));
    }

    const updatedCustomer = { id, ...payload };
    this.customers = this.customers.map(customer => (customer.id === id ? updatedCustomer : customer));
    this.emitCustomers();

    return of(updatedCustomer).pipe(delay(120));
  }

  deleteCustomer(id: number): Observable<void> {
    this.customers = this.customers.filter(customer => customer.id !== id);
    this.emitCustomers();

    return of(void 0).pipe(delay(120));
  }

  getById(id: number): Observable<Customer | undefined> {
    return this.customers$.pipe(map(customers => customers.find(customer => customer.id === id)));
  }

  private emitCustomers(): void {
    this.customersSubject.next([...this.customers]);
  }
  private sortById(customers: Customer[]): Customer[] {
  return [...customers].sort((a, b) => a.id - b.id);
}
}
