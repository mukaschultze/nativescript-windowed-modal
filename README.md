# Nativescript Windowed Modal

This plugin overrides the ```showModal()``` from nativescript, making modals look and behave the same on Android and IOS.

**NativeScript 5.x only, for older versions use 1.0.3 instead.**

## Installation

```cmd
tns plugin add nativescript-windowed-modal
```

## Usage

### Code

Call the ```overrideModalViewMethod()``` once before starting the app and register the layout element:

#### Javascript

```javascript
var windowedModal = require("nativescript-windowed-modal");
windowedModal.overrideModalViewMethod();
```

#### Typescript

```typescript
import { ModalStack, overrideModalViewMethod } from "nativescript-windowed-modal";

overrideModalViewMethod();
registerElement("ModalStack", () => ModalStack);
```

### Layout

Wrap your modal component with a ```ModalStack``` tag to layout the elements in a consistent way across platforms, it will also dismiss the modal when touching outsite of the frame on iOS:

#### XML

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd" xmlns:modal="nativescript-windowed-modal">
    <modal:ModalStack class="modal">
        <Label text="Hi, I'm your modal."/>
    </modal:ModalStack>
</Page>
```

#### HTML (Angular)

```html
<ModalStack class="modal-container">
    <StackLayout class="modal">
        <Label text="Hi, I'm your modal."></Label>
    </StackLayout>
</ModalStack>
```

### Style

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
