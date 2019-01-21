import { AndroidActivityBackPressedEventData } from "tns-core-modules/application";
import { Color } from "tns-core-modules/color";
import { isIOS, screen } from "tns-core-modules/platform";
import * as ViewClass from "tns-core-modules/ui/core/view";
import * as utils from "tns-core-modules/utils/utils";

// tslint:disable-next-line:no-implicit-dependencies
const viewCommon = require("ui/core/view/view-common").ViewCommon;
const modalMap = new Map<number, CustomDialogOptions>();

let DialogFragmentStatic;

interface CustomDialogOptions {
    owner: ViewClass.View;
    fullscreen: boolean;
    stretched: boolean;
    shownCallback: () => void;
    dismissCallback: () => void;
    dimAmount: number;
}

export interface ExtendedShowModalOptions extends ViewClass.ShowModalOptions {
    dimAmount?: number;
}

export function overrideModalViewMethod(): void {
    (ViewClass.View as any).prototype._showNativeModalView = isIOS ? iosModal : androidModal;
}

// https://github.com/NativeScript/NativeScript/blob/master/tns-core-modules/ui/core/view/view.ios.ts
function iosModal(parent: any, options: ExtendedShowModalOptions) {

    const dimAmount = options.dimAmount !== undefined ? +options.dimAmount : 0.5;
    const dimmingColor = this.backgroundColor || (this.content ? this.content.backgroundColor : undefined);
    const parentWithController = ViewClass.ios.getParentWithViewController(parent);

    if (!parentWithController) {
        throw new Error(`Could not find parent with viewController for ${parent} while showing modal view.`);
    }

    const parentController = parentWithController.viewController;

    if (!parentController.view || !parentController.view.window) {
        throw new Error("Parent page is not part of the window hierarchy. Close the current modal page before showing another one!");
    }

    this._setupAsRootView({});
    viewCommon.prototype._showNativeModalView.call(this, parentWithController, options);

    let controller = this.viewController;

    if (!controller) {
        const nativeView = this.ios || this.nativeViewProtected;
        controller = ViewClass.ios.UILayoutViewController.initWithOwner(new WeakRef(this));

        if (nativeView instanceof UIView) {
            controller.view.addSubview(nativeView);
        }

        this.viewController = controller;
    }

    if (options.fullscreen) {
        controller.modalPresentationStyle = UIModalPresentationStyle.FormSheet;
    } else {
        controller.providesPresentationContextTransitionStyle = true;
        controller.definesPresentationContext = true;
        controller.modalPresentationStyle = UIModalPresentationStyle.OverCurrentContext;
        controller.modalTransitionStyle = UIModalTransitionStyle.CoverVertical;

        controller.view.backgroundColor = dimmingColor ?
            UIColor.colorWithRedGreenBlueAlpha(dimmingColor.r, dimmingColor.g, dimmingColor.b, dimmingColor.a) :
            UIColor.colorWithRedGreenBlueAlpha(0, 0, 0, dimAmount);
    }

    if (options.ios && options.ios.presentationStyle) {
        controller.modalPresentationStyle = options.ios.presentationStyle;

        if (options.ios.presentationStyle === UIModalPresentationStyle.Popover) {
            const popoverPresentationController = controller.popoverPresentationController;
            const view = parent.nativeViewProtected;
            // Note: sourceView and sourceRect are needed to specify the anchor location for the popover.
            // Note: sourceView should be the button triggering the modal. If it the Page the popover might appear "behind" the page content
            popoverPresentationController.sourceView = view;
            popoverPresentationController.sourceRect = CGRectMake(0, 0, view.frame.size.width, view.frame.size.height);
        }
    }

    this.horizontalAlignment = "center";
    this.verticalAlignment = "middle";

    this._raiseShowingModallyEvent();
    options.animated = options.animated === undefined ? true : !!options.animated;
    (controller as any).animated = options.animated;
    parentController.presentViewControllerAnimatedCompletion(controller, options.animated, null);

    const transitionCoordinator = utils.ios.getter(parentController, parentController.transitionCoordinator);

    if (transitionCoordinator) {
        UIViewControllerTransitionCoordinator.prototype.animateAlongsideTransitionCompletion.call(transitionCoordinator, null, () => this._raiseShownModallyEvent());
    } else {
        // Apparently iOS 9+ stops all transitions and animations upon application suspend and transitionCoordinator becomes null here in this case.
        // Since we are not waiting for any transition to complete, i.e. transitionCoordinator is null, we can directly raise our shownModally event.
        // Take a look at https://github.com/NativeScript/NativeScript/issues/2173 for more info and a sample project.
        this._raiseShownModallyEvent();
    }

}

// https://github.com/NativeScript/NativeScript/blob/master/tns-core-modules/ui/core/view/view.android.ts
function androidModal(parent: any, options: ExtendedShowModalOptions) {

    const DOM_ID = "_domId";

    viewCommon.prototype._showNativeModalView.call(this, parent, options);

    if (!this.backgroundColor) {
        this.backgroundColor = new Color("transparent");

        setTimeout(() => {
            this.width = screen.mainScreen.widthDIPs + 1;
            this.height = screen.mainScreen.heightDIPs + 1;
            this.horizontalAlignment = "stretch";
            this.verticalAlignment = "stretch";
        }, 5);
    }

    this._setupUI(parent._context);
    this._isAddedToNativeVisualTree = true;

    const initializeDialogFragment = () => {

        if (DialogFragmentStatic) { return DialogFragmentStatic; }

        class CustomDialogImpl extends android.app.Dialog {

            constructor(
                public fragment: CustomDialogFragmentImpl,
                context: android.content.Context,
                themeResId: number
            ) {
                super(context, themeResId);
                return global.__native(this);
            }

            onBackPressed(): void {

                const view = this.fragment.owner;
                const evt: AndroidActivityBackPressedEventData = {
                    eventName: "activityBackPressed",
                    object: view,
                    activity: view._context,
                    cancel: false
                };

                view.notify(evt);

                if (!evt.cancel && !view.onBackPressed()) {
                    super.onBackPressed();
                }
            }
        }

        class CustomDialogFragmentImpl extends android.support.v4.app.DialogFragment {

            owner: any;
            private _fullscreen: boolean;
            private _stretched: boolean;
            private _shownCallback: () => void;
            private _dismissCallback: () => void;

            constructor() {
                try {
                    super();
                } catch (e) {
                    console.log(e);
                }
                return global.__native(this);
            }

            onCreateDialog(savedInstanceState: android.os.Bundle): android.app.Dialog {
                const ownerId = this.getArguments().getInt(DOM_ID);
                const customDialogOptions = modalMap.get(ownerId);

                this.owner = customDialogOptions.owner;
                this._fullscreen = customDialogOptions.fullscreen;
                this._stretched = customDialogOptions.stretched;
                this._dismissCallback = customDialogOptions.dismissCallback;
                this._shownCallback = customDialogOptions.shownCallback;
                this.owner._dialogFragment = this;

                this.setStyle(android.support.v4.app.DialogFragment.STYLE_NO_TITLE, 0);

                const dialog = new CustomDialogImpl(this, this.getActivity(), this.getTheme());

                if (!this._fullscreen && !this._stretched) {
                    this.owner.horizontalAlignment = "center";
                    this.owner.verticalAlignment = "middle";
                } else {
                    this.owner.horizontalAlignment = "stretch";
                    this.owner.verticalAlignment = "stretch";
                }

                const window = dialog.getWindow();

                window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
                window.setDimAmount(customDialogOptions.dimAmount);

                return dialog;
            }

            onCreateView(inflater: android.view.LayoutInflater, container: android.view.ViewGroup, savedInstanceState: android.os.Bundle): android.view.View {
                const owner = this.owner;
                owner._setupAsRootView(this.getActivity());
                owner._isAddedToNativeVisualTree = true;

                return owner.nativeViewProtected;
            }

            onStart(): void {
                super.onStart();
                if (this._fullscreen) {
                    const window = this.getDialog().getWindow();
                    const length = android.view.ViewGroup.LayoutParams.MATCH_PARENT;
                    window.setLayout(length, length);
                    // This removes the default backgroundDrawable so there are no margins.
                    // window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.WHITE));
                    window.setBackgroundDrawable(null);
                }

                const owner = this.owner;

                if (!owner.isLoaded) {
                    owner.callLoaded();
                }

                this._shownCallback();
            }

            onDismiss(dialog: android.content.DialogInterface): void {
                super.onDismiss(dialog);
                const manager = this.getFragmentManager();
                if (manager) {
                    modalMap.delete(this.owner._domId);
                    this._dismissCallback();
                }

                const owner = this.owner;
                if (owner.isLoaded) {
                    owner.callUnloaded();
                }
            }

            onDestroy(): void {
                super.onDestroy();
                const owner = this.owner;
                owner._isAddedToNativeVisualTree = false;
                owner._tearDownUI(true);
            }

        }
        DialogFragmentStatic = CustomDialogFragmentImpl;
    };

    initializeDialogFragment();
    const args = new android.os.Bundle();
    args.putInt(DOM_ID, this._domId);

    this._dialogFragment = new DialogFragmentStatic();
    this._dialogFragment.setArguments(args);

    const dialogOptions: CustomDialogOptions = {
        owner: this,
        fullscreen: !!options.fullscreen,
        stretched: !!options.stretched,
        shownCallback: () => this._raiseShownModallyEvent(),
        dismissCallback: () => this.closeModal(),
        dimAmount: options.dimAmount !== undefined ? +options.dimAmount : 0.5
    };

    modalMap.set(dialogOptions.owner._domId, dialogOptions);
    viewCommon.prototype._raiseShowingModallyEvent.call(this);
    this._dialogFragment.show(parent._getRootFragmentManager(), this._domId.toString());

}
