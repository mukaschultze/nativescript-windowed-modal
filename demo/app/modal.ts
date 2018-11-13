import { Label } from "tns-core-modules/ui/label";
import { Page, ShownModallyData } from 'tns-core-modules/ui/page';

let closeCallback: Function;

export function shownModally(args: ShownModallyData): void {
    closeCallback = args.closeCallback;

    const page = <Page>args.object.get("page");
    const label = <Label>page.getViewById("contextLabel");

    label.text = args.context;
}

export function buttonTap(): void {
    closeCallback("Return context");
}