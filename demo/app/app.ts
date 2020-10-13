import { Application } from "@nativescript/core";
import { overrideModalViewMethod } from "nativescript-windowed-modal";

overrideModalViewMethod();
Application.run({ moduleName: "main-page" });
