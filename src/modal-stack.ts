import { CSSType, View } from "tns-core-modules/ui/layouts/layout-base";
import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout/stack-layout";

@CSSType("ModalStack")
export class ModalStack extends StackLayout {

    constructor() {
        super();
    }

    onLoaded(): void {
        super.onLoaded();

        const modalView = this.getChildAt(0);

        this.set("height", "100%");
        this.set("width", "100%");
        this.horizontalAlignment = "center";
        this.verticalAlignment = "middle";
        this.addEventListener("tap", (evt) => this.outsideTap(evt, modalView));

    }

    outsideTap(args: any, modal: View): void {

        if (args.ios) {
            const view = args.ios.view;
            const tapPos = args.ios.locationInView(view);
            const modalFrame = modal.ios.frame;
            const insideRect = CGRectContainsPoint(modalFrame, tapPos);

            if (insideRect) { // Touched inside, don't close.
                return;
            }
        }

        modal.closeModal();
    }

}
