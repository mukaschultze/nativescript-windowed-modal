# Nativescript Windowed Modal

This plugin overrides the ```showModal()``` from nativescript, making modals look and behave the same on Android and IOS.

**NativeScript 5.x only, for older versions use 1.0.3 instead.**

## Installation

```javascript
tns plugin add nativescript-windowed-modal
```

## Usage

Call the ```overrideModalViewMethod()``` and register the layout element:

```javascript
import { ModalStack, overrideModalViewMethod } from "nativescript-windowed-modal";

overrideModalViewMethod();
registerElement("ModalStack", () => ModalStack);
```

Wrap your modal component with a ```ModalStack``` tag (or whatever name you registered it) to layout the elements in a consistent way across platforms, it will also dismiss the modal when touching outsite of the frame on iOS:

```html
<ModalStack class="modal-container">
    <StackLayout class="modal">
        <Label text="Hi, I'm your modal."></Label>
    </StackLayout>
</ModalStack>
```

You may want to create a ```.modal``` class in your .css to set margins, aligment and background color:

```css
.modal {
    margin: 20;
    margin-top: 35;
    horizontal-align: center;
    vertical-align: middle;
    background-color: white;
}
```

## License

Apache License Version 2.0, January 2004
