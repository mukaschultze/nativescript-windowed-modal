import * as observable from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page';

let mainPage;

export function pageLoaded(args: observable.EventData) {
    mainPage = <Page>args.object;
}

export function openModal() {
    mainPage.showModal("./modal", "I'm the context", (response: string) => {
        alert("Response: " + response);
    }, false);
}
