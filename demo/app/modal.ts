import { Page, ShownModallyData } from 'tns-core-modules/ui/page';

let closeCallback: Function;

export function showingModally(args: ShownModallyData): void {
    closeCallback = args.closeCallback;

    (<Page>args.object).content.set("backgroundColor", args.context.dim);
    // (<Page>args.object).backgroundColor = args.context.dim;


    console.log("Modal context: " + args.context.message);
}

export function buttonTap(): void {
    closeCallback("Return response here");
}