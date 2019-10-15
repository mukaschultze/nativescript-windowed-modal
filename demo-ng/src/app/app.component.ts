import { Component, ViewContainerRef } from "@angular/core";
import { ModalDialogService } from "nativescript-angular/modal-dialog";
import { ModalComponent } from "./modal/modal.component";

@Component({
    selector: "ns-app",
    templateUrl: "./app.component.html"
})
export class AppComponent {

    constructor(
        private modalService: ModalDialogService,
        private vcRef: ViewContainerRef,
    ) { }

    async openModal1() {
        const response = await this.modalService.showModal(ModalComponent, {
            context: {
                message: "I'm the context"
            },
            fullscreen: false,
            viewContainerRef: this.vcRef,
        });
        console.log("Modal response: " + response);
    }

    async openModal2() {
        const response = await this.modalService.showModal(ModalComponent, {
            context: {
                dim: "#00000000",
                message: "I'm the context"
            },
            fullscreen: false,
            viewContainerRef: this.vcRef,
            dimAmount: 0.05,
        } as any);
        console.log("Modal response: " + response);
    }

    async openModal3() {
        const response = await this.modalService.showModal(ModalComponent, {
            context: {
                dim: "#5C00FFDD",
                message: "I'm the context"
            },
            fullscreen: false,
            viewContainerRef: this.vcRef,
            dimAmount: 0.1,
        } as any);
        console.log("Modal response: " + response);
    }

    async openModal4() {
        const response = await this.modalService.showModal(ModalComponent, {
            context: {
                dim: "#FFFF0000",
                message: "I'm the context"
            },
            fullscreen: false,
            viewContainerRef: this.vcRef,
        });
        console.log("Modal response: " + response);
    }

    async openModal5() {
        const response = await this.modalService.showModal(ModalComponent, {
            context: {
                dim: "#5C00FFDD",
                message: "I'm the context"
            },
            fullscreen: true,
            viewContainerRef: this.vcRef,
        });
        console.log("Modal response: " + response);
    }

    async openModal6() {
        const response = await this.modalService.showModal(ModalComponent, {
            context: {
                message: "I'm the context"
            },
            fullscreen: true,
            viewContainerRef: this.vcRef,
        });
        console.log("Modal response: " + response);
    }


}
