import { Observable } from 'tns-core-modules/data/observable';
import { WindowedModal } from 'nativescript-windowed-modal';

export class HelloWorldModel extends Observable {
  public message: string;
  private windowedModal: WindowedModal;

  constructor() {
    super();

    this.windowedModal = new WindowedModal();
    this.message = this.windowedModal.message;
  }
}
