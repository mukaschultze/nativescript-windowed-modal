import * as observable from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page';
import { ExtendedShowModalOptions } from "../../src/windowed-modal.common";

let mainPage: Page;

export function pageLoaded(args: observable.EventData) {
    mainPage = <Page>args.object;
}

export function openModal1() {
    mainPage.showModal("./modal", {
        context: {
            message: "I'm the context"
        },
        fullscreen: false,
        closeCallback: (response: string) => {
            // Response will be undefined if the modal was
            // closed by a touch outside of the frame
            console.log("Modal response: " + response);
        }
    });
}

export function openModal2() {
    mainPage.showModal("./modal", {
        context: {
            dim: "#00000000",
            message: "I'm the context"
        },
        fullscreen: false,
        closeCallback: (response: string) => {
            // Response will be undefined if the modal was
            // closed by a touch outside of the frame
            console.log("Modal response: " + response);
        },
        dimAmount: 0.05
    } as ExtendedShowModalOptions);
}

export function openModal3() {
    mainPage.showModal("./modal", {
        context: {
            dim: "#5C00FFDD",
            message: "I'm the context"
        },
        fullscreen: false,
        dimAmount: 0.1,
        closeCallback: (response: string) => {
            // Response will be undefined if the modal was
            // closed by a touch outside of the frame
            console.log("Modal response: " + response);
        }
    } as ExtendedShowModalOptions);
}

export function openModal4() {
    mainPage.showModal("./modal", {
        context: {
            dim: "#FFFF0000",
            message: "I'm the context"
        },
        fullscreen: false,
        closeCallback: (response: string) => {
            // Response will be undefined if the modal was
            // closed by a touch outside of the frame
            console.log("Modal response: " + response);
        }
    });
}

export function openModal5() {
    mainPage.showModal("./modal", {
        context: {
            dim: "#5C00FFDD",
            message: "I'm the context"
        },
        fullscreen: true,
        closeCallback: (response: string) => {
            // Response will be undefined if the modal was
            // closed by a touch outside of the frame
            console.log("Modal response: " + response);
        }
    });
}

export function openModal6() {
    mainPage.showModal("./modal", {
        context: {
            message: "I'm the context"
        },
        fullscreen: true,
        closeCallback: (response: string) => {
            // Response will be undefined if the modal was
            // closed by a touch outside of the frame
            console.log("Modal response: " + response);
        }
    });
}
