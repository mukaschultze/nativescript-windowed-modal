import { CSSType, EventData, LayoutBase, View } from "tns-core-modules/ui/layouts/layout-base";
import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout/stack-layout";

@CSSType("ModalStack")
export class ModalStack extends StackLayout {

    constructor() {
        super();
    }

    onLoaded(): void {
        super.onLoaded();

        const modalView = <LayoutBase>this.getChildAt(0);

        modalView.isPassThroughParentEnabled = false;

        this.set("height", "100%");
        this.set("width", "100%");
        this.horizontalAlignment = "center";
        this.verticalAlignment = "middle";
        this.isPassThroughParentEnabled = false;
        this.addEventListener("tap", (evt) => this.outsideTap(evt, modalView));

    }

    private outsideTap(args: EventData, modal: View): void {

        const iosMotion = (<any>args).ios;
        const androidMotion: android.view.MotionEvent = (<any>args).android;

        if (iosMotion) {
            const view = iosMotion.view;
            const tapPos = iosMotion.locationInView(view);
            const modalFrame = modal.ios.frame;
            const insideRect = CGRectContainsPoint(modalFrame, tapPos);

            if (insideRect) { // Touched inside, don't close.
                return;
            }
        } else {
            const rect = new android.graphics.Rect();
            modal.android.getHitRect(rect);
            const insideRect = rect.contains(androidMotion.getX(), androidMotion.getY());

            if (insideRect) { // Touched inside, don't close.
                return;
            }
        }

        modal.closeModal();
    }

}
