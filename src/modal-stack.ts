import { GestureEventData } from "@nativescript/core/ui/gestures/gestures";
import { booleanConverter, CSSType, isIOS, layout, LayoutBase, View } from "@nativescript/core/ui/layouts/layout-base";
import { StackLayout } from "@nativescript/core/ui/layouts/stack-layout/stack-layout";
import { HorizontalAlignment, VerticalAlignment } from "@nativescript/core/ui/styling/style-properties";

@CSSType("ModalStack")
export class ModalStack extends StackLayout {

    dismissEnabled: string = "true";
    verticalPosition: VerticalAlignment = "middle";
    horizontalPosition: HorizontalAlignment = "center";

    constructor() {
        super();
    }

    onLoaded(): void {
        super.onLoaded();

        const modalView = this.getChildAt(0) as LayoutBase;

        this.set("height", "100%");
        this.set("width", "100%");
        this.horizontalAlignment = this.horizontalPosition;
        this.verticalAlignment = this.verticalPosition;
        this.on("tap", (evt) => this.outsideTap(evt as GestureEventData, modalView));

    }

    private outsideTap(args: GestureEventData, modal: View): void {
        if (!booleanConverter(this.dismissEnabled)) {
            return; // Don't close the modal
        }

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
