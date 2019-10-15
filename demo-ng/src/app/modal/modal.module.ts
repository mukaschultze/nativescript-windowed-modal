import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { ModalComponent } from "./modal.component";

@NgModule({
  declarations: [
    ModalComponent,
  ],
  exports: [
    ModalComponent,
  ],
  entryComponents: [
    ModalComponent,
  ],
  imports: [
    NativeScriptCommonModule
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ModalModule { }
