import { ShownModallyData } from 'tns-core-modules/ui/page';

let closeCallback: Function;

export function shownModally(args: ShownModallyData): void {
    closeCallback = args.closeCallback;

    console.log("Modal context: " + args.context);
}

export function buttonTap(): void {
    closeCallback("Return response here");
}