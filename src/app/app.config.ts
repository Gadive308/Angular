import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import vi from '@angular/common/locales/vi';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  CloseOutline,
  DeleteOutline,
  EditOutline,
  EyeOutline,
  PlusOutline,
  ReloadOutline,
  SaveOutline
} from '@ant-design/icons-angular/icons';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_I18N, vi_VN } from 'ng-zorro-antd/i18n';

registerLocaleData(vi);

const icons = [
  CloseOutline,
  DeleteOutline,
  EditOutline,
  EyeOutline,
  PlusOutline,
  ReloadOutline,
  SaveOutline
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(NzIconModule.forRoot(icons)),
    { provide: NZ_I18N, useValue: vi_VN }
  ]
};
