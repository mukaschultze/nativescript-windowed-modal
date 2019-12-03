import * as application from "@nativescript/core/application";
import { overrideModalViewMethod } from "nativescript-windowed-modal";

overrideModalViewMethod();
application.run({ moduleName: "main-page" });
