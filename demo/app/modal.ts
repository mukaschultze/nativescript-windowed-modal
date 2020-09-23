import { ShownModallyData, Page } from '@nativescript/core';

// tslint:disable-next-line:ban-types
let closeCallback: Function;

export function showingModally(args: ShownModallyData): void {
    closeCallback = args.closeCallback;

    (args.object as Page).content.set("backgroundColor", args.context.dim);

    console.log("Modal context: " + args.context.message);
}

export function buttonTap(): void {
    closeCallback("Return response here");
}
