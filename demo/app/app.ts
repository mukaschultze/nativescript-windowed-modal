import { overrideModalViewMethod } from "nativescript-windowed-modal";
import * as application from "tns-core-modules/application";

overrideModalViewMethod();
application.start({ moduleName: "main-page" });
