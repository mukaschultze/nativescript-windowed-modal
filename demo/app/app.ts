import { overrideModalViewMethod } from "nativescript-windowed-modal";
import { Application } from '@nativescript/core';

overrideModalViewMethod();
Application.run({ moduleName: "main-page" });
