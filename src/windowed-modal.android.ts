import { android as androidApp, AndroidActivityBackPressedEventData } from '@nativescript/core/application';
import { Color } from '@nativescript/core/color';
import { screen } from '@nativescript/core/platform';
import * as viewModule from '@nativescript/core/ui/core/view';
import { ExtendedShowModalOptions } from './windowed-modal.common';

// tslint:disable-next-line:no-implicit-dependencies
const viewCommon = require('@nativescript/core/ui/core/view/view-common').ViewCommon;
const modalMap = new Map<number, CustomDialogOptions>();

const DOMID = '_domId';

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

export function overrideModalViewMethod(): void {
  (viewModule.View as any).prototype._showNativeModalView = androidModal;
}

// https://github.com/NativeScript/NativeScript/blob/master/tns-core-modules/ui/core/view/view.android.ts
function androidModal(parent: any, options: ExtendedShowModalOptions) {
  viewCommon.prototype._showNativeModalView.call(this, parent, options);

  const backgroundColor: Color = this.backgroundColor;
  const dimAmount = options.dimAmount !== undefined ? options.dimAmount : 0.5;
  if (backgroundColor) {
    this.backgroundColor = new Color(255 * dimAmount, backgroundColor.r, backgroundColor.g, backgroundColor.b);
  } else {
    this.backgroundColor = new Color(255 * dimAmount, 0, 0, 0);
  }

  this.width = screen.mainScreen.widthDIPs + 1;
  this.height = screen.mainScreen.heightDIPs + 1;
  this.horizontalAlignment = 'stretch';
  this.verticalAlignment = 'stretch';

  this._setupUI(parent._context);
  this._isAddedToNativeVisualTree = true;

  const initializeDialogFragment = () => {
    if (DialogFragmentStatic) {
      return DialogFragmentStatic;
    }

    class CustomDialogImpl extends android.app.Dialog {
      constructor(public fragment: CustomDialogFragmentImpl, context: android.content.Context, themeResId: number) {
        super(context, themeResId);
        return global.__native(this);
      }

      public onDetachedFromWindow(): void {
        super.onDetachedFromWindow();
        this.fragment = null;
      }

      public onBackPressed(): void {
        const view = this.fragment.owner;
        const args = {
          // tslint:disable-line
          eventName: 'activityBackPressed',
          object: view,
          activity: view._context,
          cancel: false
        } as AndroidActivityBackPressedEventData;

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
        const options = getModalOptions(ownerId); // tslint:disable-line
        this.owner = options.owner;
        this._fullscreen = options.fullscreen;
        this._cancelable = options.cancelable;
        this._stretched = options.stretched;
        this._dismissCallback = options.dismissCallback;
        this._shownCallback = options.shownCallback;
        this.setStyle(androidx.fragment.app.DialogFragment.STYLE_NO_TITLE, 0);

        let theme = this.getTheme();

        const dialog = new CustomDialogImpl(this, this.getActivity(), theme);

        // do not override alignment unless fullscreen modal will be shown;
        // otherwise we might break component-level layout:
        // https://github.com/NativeScript/NativeScript/issues/5392
        if (!this._fullscreen && !this._stretched) {
          this.owner.horizontalAlignment = 'center';
          this.owner.verticalAlignment = 'middle';
        } else {
          this.owner.horizontalAlignment = 'stretch';
          this.owner.verticalAlignment = 'stretch';
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

        const window = this.getDialog().getWindow();
        const length = android.view.ViewGroup.LayoutParams.MATCH_PARENT;
        window.setLayout(length, length);
        // This removes the default backgroundDrawable so there are no margins.
        // window.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.WHITE));
        window.setBackgroundDrawable(null);

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
