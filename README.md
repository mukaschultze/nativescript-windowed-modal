# Nativescript Windowed Modal

This plugin overrides the `showModal()` from nativescript, making modals look and behave the same on Android and iOS.

**NativeScript 5.x only, for older NS versions use 1.0.3 instead.**

## Installation

```cmd
tns plugin add nativescript-windowed-modal
```

## Usage

### Code

Call the `overrideModalViewMethod()` once before starting the app and register the layout element:

#### Javascript

```js
var windowedModal = require("nativescript-windowed-modal");
windowedModal.overrideModalViewMethod();
```

#### Typescript+Angular

```ts
import { ExtendedShowModalOptions, ModalStack, overrideModalViewMethod } from "nativescript-windowed-modal";

overrideModalViewMethod();
registerElement("ModalStack", () => ModalStack);
```

You can pass extended options like this:

```ts
mainPage.showModal("./modal", {
    context: "I'm the context",
    closeCallback: (response: string) => console.log("Modal response: " + response),
    dimAmount: 0.5 // Sets the alpha of the background dim
} as ExtendedShowModalOptions);
```

### Properties

#### [ExtendedShowModalOptions](../master/src/windowed-modal.common.ts#L13)

| Property | Type | Platform | Default | Description |
| -------- | ---- | -------- | ------- | ----------- |
| dimAmount? | number | both | 0.5 | Controls the alpha value of the dimming color. On android, setting this to 0 disables the fade in animation. On iOS this value will be replaced with the alpha of the background color if it is set.

#### [ModalStack](../master/src/modal-stack.ts#L8)

| Property | Type | Platform | Default | Description |
| -------- | ---- | -------- | ------- | ----------- |
| dismissEnabled | boolean | both | true | If set to true, the modal is allowed to close when touching outside of the content frame

### Layout

Wrap your modal component with a `ModalStack` tag to layout the elements in a consistent way across platforms, it will also allows you to dismiss the modal when touching outsite of the frame:

#### XML

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd" xmlns:modal="nativescript-windowed-modal">
    <modal:ModalStack dismissEnabled="true" class="modal-container">
        <StackLayout class="modal">
            <Label text="Hi, I'm your modal" class="text-center" textWrap="true"/>
        </StackLayout>
    </modal:ModalStack>
</Page>
```

#### HTML (Angular)

```html
<ModalStack dismissEnabled="true" class="modal-container">
    <StackLayout class="modal">
        <Label text="Hi, I'm your modal" class="text-center" textWrap="true"></Label>
    </StackLayout>
</ModalStack>
```

### Style

You may want to create the `.modal` and `.modal-container` classes in your .css to set margins, aligment and background color:

```css
.modal {
    margin: 20;
    margin-top: 35;
    border-radius: 8;
    horizontal-align: center;
    vertical-align: middle;
    background-color: white;
}

.modal-container {
    padding: 25;
    padding-bottom: 10;
}
```

## Running the demo app

1. Clone this repo
2. `cd src`
3. `npm install && npm run plugin.prepare`
4. `npm run demo.android` or `npm run demo.ios`

## Changelog

### v5.0.3

- Support for dimAmount and dismissEnabled properties

## Known Issues

- Padding won't apply on children of the `ModalStack`, wrapping them with a `StackLayout` fixes the problem;
- Auto width is kinda buggy on some situations, set a fixed width for children of `ModalStack` when possible;

## License

Apache License Version 2.0, January 2004
