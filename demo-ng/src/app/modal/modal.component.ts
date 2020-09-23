import { Component } from "@angular/core";
import { ModalDialogParams } from "@nativescript/angular";

@Component({
  selector: "ns-modal",
  templateUrl: "./modal.component.html",
  styleUrls: ["./modal.component.css"],
})
export class ModalComponent {

  bgColor;

  constructor(private params: ModalDialogParams) {
    this.bgColor = params.context.dim;
  }

  buttonTap() {
    this.params.closeCallback("Return response here");
  }

}
