# Nativescript Windowed Modal

This plugin overrides the ```showModal()``` from nativescript, making modals look and behave the same on Android and IOS.

## Installation

```javascript
tns plugin add nativescript-windowed-modal
```

## Usage

Call the ```overrideModalViewMethod()``` and register the layout element:

```javascript
import { overrideModalViewMethod } from "nativescript-windowed-modal";

overrideModalViewMethod();
registerElement("ModalStack", () => require("nativescript-windowed-modal").ModalStack);
```

Wrap your modal component with a ```ModalStack``` tag (or whatever name you registered it) to layout the elements in a consistent way between platforms, it will also dismiss the modal when touching outsite of the frame on iOS:

```html
<ModalStack>
    <StackLayout>
        <Label text="Hi, I'm your modal."></Label>
    </StackLayout>
</ModalStack>
```

You may want to create a ```.modal``` class in your .css to set margins, aligment and background color, this class is automatically set on the content of the modal:

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
