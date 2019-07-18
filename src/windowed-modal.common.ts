import { android as androidApp, AndroidActivityBackPressedEventData } from "tns-core-modules/application";
import { Color } from "tns-core-modules/color";
import { isIOS, screen } from "tns-core-modules/platform";
import * as viewModule from "tns-core-modules/ui/core/view";
import { traceCategories, traceMessageType, traceWrite } from "tns-core-modules/ui/core/view-base";

// tslint:disable-next-line:no-implicit-dependencies
const viewCommon = require("ui/core/view/view-common").ViewCommon;
const modalMap = new Map<number, CustomDialogOptions>();

const DOMID = "_domId";

function saveModal(options: CustomDialogOptions) {
    modalMap.set(options.owner._domId, options);
}

function removeModal(domId: number) {
    modalMap.delete(domId);
}

function getModalOptions(domId: number): CustomDialogOptions {
    return modalMap.get(domId);
}

let DialogFragmentStatic;

interface CustomDialogOptions {
    owner: viewModule.View;
    fullscreen: boolean;
    stretched: boolean;
    cancelable: boolean;
    shownCallback: () => void;
    dismissCallback: () => void;
    dimAmount: number;
}

export interface ExtendedShowModalOptions extends viewModule.ShowModalOptions {
    dimAmount?: number;
}

export function overrideModalViewMethod(): void {
    (viewModule.View as any).prototype._showNativeModalView = isIOS ? iosModal : androidModal;
}

// https://github.com/NativeScript/NativeScript/blob/master/tns-core-modules/ui/core/view/view.ios.ts
function iosModal(parent: any, options: ExtendedShowModalOptions) {

    const dimAmount = options.dimAmount !== undefined ? +options.dimAmount : 0.5;
    const dimmingColor = this.backgroundColor || (this.content ? this.content.backgroundColor : undefined);
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

    if (options.fullscreen) {
        controller.modalPresentationStyle = UIModalPresentationStyle.FullScreen;
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
    (<any>controller).animated = animated;
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

// https://github.com/NativeScript/NativeScript/blob/master/tns-core-modules/ui/core/view/view.android.ts
function androidModal(parent: any, options: ExtendedShowModalOptions) {

    viewCommon.prototype._showNativeModalView.call(this, parent, options);

    if (!this.backgroundColor) {
        this.backgroundColor = new Color("transparent");
    }

    // setTimeout(() => {
    this.width = screen.mainScreen.widthDIPs + 1;
    this.height = screen.mainScreen.heightDIPs + 1;
    this.horizontalAlignment = "stretch";
    this.verticalAlignment = "stretch";
    // }, 5);

    this._setupUI(parent._context);
    this._isAddedToNativeVisualTree = true;

    const initializeDialogFragment = () => {

        if (DialogFragmentStatic) { return DialogFragmentStatic; }

        class CustomDialogImpl extends android.app.Dialog {
            constructor(public fragment: CustomDialogFragmentImpl,
                context: android.content.Context,
                themeResId: number) {
                super(context, themeResId);

                return global.__native(this);
            }

            public onDetachedFromWindow(): void {
                super.onDetachedFromWindow();
                this.fragment = null;
            }

            public onBackPressed(): void {
                const view = this.fragment.owner;
                const args = <AndroidActivityBackPressedEventData>{
                    eventName: "activityBackPressed",
                    object: view,
                    activity: view._context,
                    cancel: false,
                };

                // Fist fire application.android global event
                androidApp.notify(args);
                if (args.cancel) {
                    return;
                }

                view.notify(args);

                if (!args.cancel && !view.onBackPressed()) {
                    super.onBackPressed();
                }
            }
        }

        class CustomDialogFragmentImpl extends androidx.fragment.app.DialogFragment {
            public owner: viewModule.View;
            private _fullscreen: boolean;
            private _stretched: boolean;
            private _cancelable: boolean;
            private _shownCallback: () => void;
            private _dismissCallback: () => void;

            constructor() {
                super();

                return global.__native(this);
            }

            public onCreateDialog(savedInstanceState: android.os.Bundle): android.app.Dialog {
                const ownerId = this.getArguments().getInt(DOMID);
                const options = getModalOptions(ownerId);
                this.owner = options.owner;
                this._fullscreen = options.fullscreen;
                this._cancelable = options.cancelable;
                this._stretched = options.stretched;
                this._dismissCallback = options.dismissCallback;
                this._shownCallback = options.shownCallback;
                this.setStyle(androidx.fragment.app.DialogFragment.STYLE_NO_TITLE, 0);

                let theme = this.getTheme();
                if (this._fullscreen) {
                    // In fullscreen mode, get the application's theme.
                    theme = this.getActivity().getApplicationInfo().theme;
                }

                const dialog = new CustomDialogImpl(this, this.getActivity(), theme);

                // do not override alignment unless fullscreen modal will be shown;
                // otherwise we might break component-level layout:
                // https://github.com/NativeScript/NativeScript/issues/5392
                if (!this._fullscreen && !this._stretched) {
                    this.owner.horizontalAlignment = "center";
                    this.owner.verticalAlignment = "middle";
                } else {
                    this.owner.horizontalAlignment = "stretch";
                    this.owner.verticalAlignment = "stretch";
                }

                dialog.setCanceledOnTouchOutside(this._cancelable);

                const window = dialog.getWindow();
                window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
                window.setDimAmount(options.dimAmount);

                return dialog;
            }

            public onCreateView(inflater: android.view.LayoutInflater, container: android.view.ViewGroup, savedInstanceState: android.os.Bundle): android.view.View {
                const owner = this.owner;
                (owner as any)._setupAsRootView(this.getActivity());
                owner._isAddedToNativeVisualTree = true;

                return owner.nativeViewProtected;
            }

            public onStart(): void {
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
                if (owner && !owner.isLoaded) {
                    (owner as any).callLoaded();
                }

                this._shownCallback();
            }

            public onDismiss(dialog: android.content.DialogInterface): void {
                super.onDismiss(dialog);
                const manager = this.getFragmentManager();
                if (manager) {
                    removeModal(this.owner._domId);
                    this._dismissCallback();
                }

                const owner = this.owner;
                if (owner && owner.isLoaded) {
                    (owner as any).callUnloaded();
                }
            }

            public onDestroy(): void {
                super.onDestroy();
                const owner = this.owner;

                if (owner) {
                    // Android calls onDestroy before onDismiss.
                    // Make sure we unload first and then call _tearDownUI.
                    if (owner.isLoaded) {
                        (owner as any).callUnloaded();
                    }

                    owner._isAddedToNativeVisualTree = false;
                    owner._tearDownUI(true);
                }
            }
        }
        DialogFragmentStatic = CustomDialogFragmentImpl;
    };

    initializeDialogFragment();
    const df = new DialogFragmentStatic();
    const args = new android.os.Bundle();
    args.putInt(DOMID, this._domId);
    df.setArguments(args);

    const dialogOptions: CustomDialogOptions = {
        owner: this,
        fullscreen: !!options.fullscreen,
        stretched: !!options.stretched,
        cancelable: options.android ? !!options.android.cancelable : true,
        shownCallback: () => this._raiseShownModallyEvent(),
        dismissCallback: () => this.closeModal(),
        dimAmount: options.dimAmount !== undefined ? +options.dimAmount : 0.5
    };

    saveModal(dialogOptions);

    this._dialogFragment = df;
    this._raiseShowingModallyEvent();

    this._dialogFragment.show(parent._getRootFragmentManager(), this._domId.toString());

}
