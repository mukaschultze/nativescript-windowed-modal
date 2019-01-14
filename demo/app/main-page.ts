import * as observable from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page';

let mainPage: Page;

export function pageLoaded(args: observable.EventData) {
    mainPage = <Page>args.object;
}

export function openModal() {
    mainPage.showModal("./modal", {
        context: "I'm the context",
        fullscreen: false,
        ios: { presentationStyle: UIModalPresentationStyle.FormSheet },
        closeCallback: (response: string) => {
            // Response will be undefined if the modal was
            // closed by a touch outside of the frame
            console.log("Modal response: " + response);
        }
    });
}
