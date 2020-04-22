import { Color } from "@nativescript/core/color";
import * as viewModule from "@nativescript/core/ui/core/view";
import { traceCategories, traceMessageType, traceWrite } from "@nativescript/core/ui/core/view-base";
import { ExtendedShowModalOptions } from "./windowed-modal.common";
// tslint:disable-next-line:no-implicit-dependencies
const viewCommon = require("@nativescript/core/ui/core/view/view-common").ViewCommon;

export function overrideModalViewMethod(): void {
    (viewModule.View as any).prototype._showNativeModalView = iosModal;
}

// https://github.com/NativeScript/NativeScript/blob/master/tns-core-modules/ui/core/view/view.ios.ts
function iosModal(parent: any, options: ExtendedShowModalOptions) {

    const parentWithController = viewModule.ios.getParentWithViewController(parent);
    if (!parentWithController) {
        traceWrite(`Could not find parent with viewController for ${parent} while showing modal view.`,
            traceCategories.ViewHierarchy, traceMessageType.error);

        return;
    }

    const parentController = parentWithController.viewController;
    if (parentController.presentedViewController) {
        traceWrite("Parent is already presenting view controller. Close the current modal page before showing another one!",
            traceCategories.ViewHierarchy, traceMessageType.error);

        return;
    }

    if (!parentController.view || !parentController.view.window) {
        traceWrite("Parent page is not part of the window hierarchy.",
            traceCategories.ViewHierarchy, traceMessageType.error);

        return;
    }

    this._setupAsRootView({});

    viewCommon.prototype._showNativeModalView.call(this, parentWithController, options);
    let controller = this.viewController;
    if (!controller) {
        const nativeView = this.ios || this.nativeViewProtected;
        controller = viewModule.ios.UILayoutViewController.initWithOwner(new WeakRef(this));

        if (nativeView instanceof UIView) {
            controller.view.addSubview(nativeView);
        }

        this.viewController = controller;
    }

    controller.modalPresentationStyle = options.fullscreen ?
        UIModalPresentationStyle.OverFullScreen :
        UIModalPresentationStyle.OverCurrentContext;

    controller.modalTransitionStyle = UIModalTransitionStyle.CoverVertical;
    controller.providesPresentationContextTransitionStyle = true;
    controller.definesPresentationContext = true;

    const backgroundColor: Color = this.backgroundColor;
    const dimAmount = options.dimAmount !== undefined ? options.dimAmount : 0.5;

    this.backgroundColor = backgroundColor ?
        new Color(255 * dimAmount, backgroundColor.r, backgroundColor.g, backgroundColor.b) :
        new Color(255 * dimAmount, 0, 0, 0);

    if (options.ios && options.ios.presentationStyle) {
        const presentationStyle = options.ios.presentationStyle;
        controller.modalPresentationStyle = presentationStyle;

        if (presentationStyle === UIModalPresentationStyle.Popover) {
            const popoverPresentationController = controller.popoverPresentationController;
            this._popoverPresentationDelegate = (viewModule.ios as any).UIPopoverPresentationControllerDelegateImp.initWithOwnerAndCallback(new WeakRef(this), this._closeModalCallback);
            popoverPresentationController.delegate = this._popoverPresentationDelegate;
            const view = parent.nativeViewProtected;
            // Note: sourceView and sourceRect are needed to specify the anchor location for the popover.
            // Note: sourceView should be the button triggering the modal. If it the Page the popover might appear "behind" the page content
            popoverPresentationController.sourceView = view;
            popoverPresentationController.sourceRect = CGRectMake(0, 0, view.frame.size.width, view.frame.size.height);
        }
    }

    this.horizontalAlignment = "stretch";
    this.verticalAlignment = "stretch";

    this._raiseShowingModallyEvent();
    const animated = options.animated === undefined ? true : !!options.animated;
    (controller as any).animated = animated;
    parentController.presentViewControllerAnimatedCompletion(controller, animated, null);
    const transitionCoordinator = parentController.transitionCoordinator;
    if (transitionCoordinator) {
        UIViewControllerTransitionCoordinator.prototype.animateAlongsideTransitionCompletion
            .call(transitionCoordinator, null, () => this._raiseShownModallyEvent());
    } else {
        // Apparently iOS 9+ stops all transitions and animations upon application suspend and transitionCoordinator becomes null here in this case.
        // Since we are not waiting for any transition to complete, i.e. transitionCoordinator is null, we can directly raise our shownModally event.
        // Take a look at https://github.com/NativeScript/NativeScript/issues/2173 for more info and a sample project.
        this._raiseShownModallyEvent();
    }

}
