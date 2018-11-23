import { GestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { CSSType, isIOS, layout, LayoutBase, View } from "tns-core-modules/ui/layouts/layout-base";
import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout/stack-layout";

@CSSType("ModalStack")
export class ModalStack extends StackLayout {

    constructor() {
        super();
    }

    onLoaded(): void {
        super.onLoaded();

        const modalView = <LayoutBase>this.getChildAt(0);

        this.set("height", "100%");
        this.set("width", "100%");
        this.horizontalAlignment = "center";
        this.verticalAlignment = "middle";
        this.on("tap", (evt) => this.outsideTap(evt as GestureEventData, modalView));

    }

    private outsideTap(args: GestureEventData, modal: View): void {

        if (isIOS) {
            const iosMotion = args.ios;
            const view = iosMotion.view;
            const tapPos = iosMotion.locationInView(view);
            const modalFrame = modal.ios.frame;
            const insideRect = CGRectContainsPoint(modalFrame, tapPos);

            if (insideRect) { // Touched inside, don't close.
                return;
            }
        } else {
            const androidMotion: android.view.MotionEvent = args.android;
            const x = androidMotion.getRawX() - layout.toDevicePixels(this.getLocationOnScreen().x);
            const y = androidMotion.getRawY() - layout.toDevicePixels(this.getLocationOnScreen().y);
            const rect = new android.graphics.Rect();

            modal.android.getHitRect(rect);
            const insideRect = rect.contains(x, y);

            if (insideRect) { // Touched inside, don't close.
                return;
            }
        }

        modal.closeModal();
    }

}
