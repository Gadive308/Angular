import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Customer, CustomerPayload } from './customer.model';
import { CustomerService } from './customer.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzMessageModule,
    NzModalModule,
    NzPopconfirmModule,
    NzSpaceModule,
    NzTableModule,
    NzTagModule,
    NzToolTipModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly message = inject(NzMessageService);

  customers: Customer[] = [];
  editingCustomer: Customer | null = null;
  selectedCustomer: Customer | null = null;
  total = 0;
  pageIndex = 1;
  pageSize = 5;
  loading = false;
  saving = false;
  formModalVisible = false;
  detailModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';

  readonly customerForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(20), this.duplicateCodeValidator()]],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    age: [18, [Validators.required, Validators.min(1), Validators.max(120)]],
    address: ['', [Validators.required, Validators.maxLength(180)]]
  });

  get formModalTitle(): string {
    return this.modalMode === 'create' ? 'Thêm khách hàng' : 'Sửa thông tin khách hàng';
  }

  ngOnInit(): void {
    this.loading = true;
    this.customerService
      .loadFromApi()
      .pipe(
        switchMap(() => this.customerService.getPage(this.pageIndex, this.pageSize)),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: page => {
          this.customers = page.data;
          this.total = page.total;
        },
        error: () => {
          this.message.error('Không thể tải danh sách khách hàng');
        }
      });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingCustomer = null;
    this.customerForm.reset({
      code: '',
      name: '',
      age: 18,
      address: ''
    });
    this.customerForm.controls.code.updateValueAndValidity();
    this.formModalVisible = true;
  }

  openEditModal(customer: Customer): void {
    this.modalMode = 'edit';
    this.editingCustomer = customer;
    this.customerForm.reset({
      code: customer.code,
      name: customer.name,
      age: customer.age,
      address: customer.address
    });
    this.customerForm.controls.code.updateValueAndValidity();
    this.formModalVisible = true;
  }

  openDetailModal(customer: Customer): void {
    this.selectedCustomer = customer;
    this.detailModalVisible = true;
  }

  closeDetailModal(): void {
    this.detailModalVisible = false;
    this.selectedCustomer = null;
  }

  submitCustomer(): void {
    if (this.customerForm.invalid) {
      Object.values(this.customerForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity();
      });
      return;
    }

    const payload = this.normalizePayload(this.customerForm.getRawValue());
    const request$ = this.editingCustomer
      ? this.customerService.updateCustomer(this.editingCustomer.id, payload)
      : this.customerService.addCustomer(payload);

    this.saving = true;
    request$
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: () => {
          this.message.success(this.editingCustomer ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng');
          this.formModalVisible = false;
          this.loadPage();
        },
        error: () => {
          this.message.error('Không thể lưu thông tin khách hàng');
        }
      });
  }

  deleteCustomer(customer: Customer): void {
    this.customerService.deleteCustomer(customer.id).subscribe({
      next: () => {
        this.message.success('Đã xóa khách hàng');
        this.loadPage();
      },
      error: () => {
        this.message.error('Không thể xóa khách hàng');
      }
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadPage();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.loadPage();
  }

  reloadCustomers(): void {
    this.loadPage();
  }

  private loadPage(): void {
    this.loading = true;
    this.customerService
      .getPage(this.pageIndex, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(page => {
        if (page.data.length === 0 && page.total > 0 && this.pageIndex > 1) {
          this.pageIndex -= 1;
          this.loadPage();
          return;
        }

        this.customers = page.data;
        this.total = page.total;
      });
  }

  private duplicateCodeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const ignoreId = this.editingCustomer?.id;
      return this.customerService.isCodeTaken(control.value, ignoreId) ? { duplicatedCode: true } : null;
    };
  }

  private normalizePayload(value: CustomerPayload): CustomerPayload {
    return {
      code: value.code.trim(),
      name: value.name.trim(),
      age: value.age,
      address: value.address.trim()
    };
  }
}
