import { AndroidActivityBackPressedEventData } from "tns-core-modules/application";
import { Color } from "tns-core-modules/color";
import { isIOS } from "tns-core-modules/platform";
import * as ViewClass from "tns-core-modules/ui/core/view";
import * as utils from "tns-core-modules/utils/utils";

// tslint:disable:interface-name
// tslint:disable:variable-name
// tslint:disable:typedef
// tslint:disable:space-before-function-paren
// tslint:disable:no-shadowed-variable

const viewCommon = require("ui/core/view/view-common").ViewCommon;

let DialogFragmentStatic;
const DOM_ID = "_domId";
const modalMap = new Map<number, CustomDialogOptions>();

interface CustomDialogOptions {
    owner: ViewClass.View;
    fullscreen: boolean;
    stretched: boolean;
    shownCallback: () => void;
    dismissCallback: () => void;
}

export interface ModalMessage {
    close: () => void;
}

export function overrideModalViewMethod(): void {
    (<any>ViewClass.View).prototype._showNativeModalView = function (parent: any, context: any, closeCallback: () => void, fullscreen?: boolean, animated?: boolean, stretched?: boolean) {
        if (isIOS) {
            iosModal.call(this, parent, context, closeCallback, fullscreen, animated, stretched);
        }
        else {
            androidModal.call(this, parent, context, closeCallback, fullscreen, animated, stretched);
        }
    };
}

function iosModal(parent: any, context: any, closeCallback: () => void, fullscreen?: boolean, animated?: boolean, stretched?: boolean) {

    const parentWithController = ViewClass.ios.getParentWithViewController(parent);

    viewCommon.prototype._showNativeModalView.call(this, parentWithController, context, closeCallback, fullscreen, animated, stretched);
    let controller = this.viewController;
    if (!controller) {
        const nativeView = this.ios || this.nativeViewProtected;
        controller = ViewClass.ios.UILayoutViewController.initWithOwner(new WeakRef(this));

        if (nativeView instanceof UIView) {
            controller.view.addSubview(nativeView);
        }

        this.viewController = controller;
    }

    this._setupAsRootView({});

    const parentController = parentWithController.viewController;

    if (!parentController.view.window) {
        throw new Error("Parent page is not part of the window hierarchy. Close the current modal page before showing another one!");
    }

    if (fullscreen) {
        controller.modalPresentationStyle = UIModalPresentationStyle.FormSheet;
    } else {
        controller.providesPresentationContextTransitionStyle = true;
        controller.definesPresentationContext = true;
        controller.modalPresentationStyle = UIModalPresentationStyle.OverCurrentContext;
        controller.modalTransitionStyle = UIModalTransitionStyle.CoverVertical;
        controller.view.backgroundColor = UIColor.colorWithRedGreenBlueAlpha(0, 0, 0, 0.5);
    }

    this._raiseShowingModallyEvent();
    animated = animated === undefined ? true : !!animated;
    (<any>controller).animated = animated;
    parentController.presentViewControllerAnimatedCompletion(controller, animated, null);

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

function androidModal(parent: any, context: any, closeCallback: () => void, fullscreen?: boolean, animated?: boolean, stretched?: boolean) {

    viewCommon.prototype._showNativeModalView.call(this, parent, context, closeCallback, fullscreen, stretched);

    if (!this.backgroundColor) {
        this.backgroundColor = new Color("transparent");
    }

    this._setupUI(parent._context);
    this._isAddedToNativeVisualTree = true;

    const initializeDialogFragment = () => {

        if (DialogFragmentStatic) { return DialogFragmentStatic; }

        // tslint:disable:max-classes-per-file
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
                const args: AndroidActivityBackPressedEventData = {
                    eventName: "activityBackPressed",
                    object: view,
                    activity: view._context,
                    cancel: false
                };

                view.notify(args);

                if (!args.cancel && !view.onBackPressed()) {
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
                const options = modalMap.get(ownerId);
                this.owner = options.owner;
                this._fullscreen = options.fullscreen;
                this._stretched = options.stretched;
                this._dismissCallback = options.dismissCallback;
                this._shownCallback = options.shownCallback;
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
    const df = new DialogFragmentStatic();
    const args = new android.os.Bundle();

    args.putInt(DOM_ID, this._domId);
    df.setArguments(args);

    const dialogOptions: CustomDialogOptions = {
        owner: this,
        fullscreen: !!fullscreen,
        stretched: !!stretched,
        shownCallback: () => this._raiseShownModallyEvent(),
        dismissCallback: () => this.closeModal()
    };

    modalMap.set(dialogOptions.owner._domId, dialogOptions);
    this._dialogFragment = df;
    viewCommon.prototype._raiseShowingModallyEvent.call(this);
    this._dialogFragment.show(parent._getRootFragmentManager(), this._domId.toString());

}
