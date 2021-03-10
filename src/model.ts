/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Francesco Murdaca <fmurdaca@redhat.com>
 * @since  0.0.1
 */

// References adaptation from: https://github.com/jupyterlab/extension-examples/blob/master/kernel-messaging/src/model.ts


import { ISessionContext } from '@jupyterlab/apputils';

import { IOutput } from '@jupyterlab/nbformat';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import { ISignal, Signal } from '@lumino/signaling';

export class KernelModel {
  constructor(session: ISessionContext) {
    this._sessionContext = session;
  }

  get future(): Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | null {
    return this._future;
  }

  set future(
    value: Kernel.IFuture<
      KernelMessage.IExecuteRequestMsg,
      KernelMessage.IExecuteReplyMsg
    > | null
  ) {
    this._future = value;
    if (!value) {
      return;
    }
    value.onIOPub = this._onIOPub;
  }

  get output(): IOutput | null {
    return this._output;
  }

  get stateChanged(): ISignal<KernelModel, void> {
    return this._stateChanged;
  }

  async get_kernel_output(): Promise<IOutput | null> {
    return this._output;
  }

  async execute(code: string): Promise<void> {
    if (!this._sessionContext || !this._sessionContext.session?.kernel) {
        return;
      }

    // Once a kernel is initialized and ready, code can be executed with the following snippet:
    this.future = this._sessionContext.session?.kernel?.requestExecute({
        code,
      });
    // future is an object that can receive some messages from the kernel
    // as a reply to your execution request (see jupyter messaging https://jupyter-client.readthedocs.io/en/stable/messaging.html).
    // One of these messages contains the data of the execution result.
  }

  // It is published on a channel called IOPub
  // and can be identified by the message types execute_result, display_data and update_display_data.
  private _onIOPub = (msg: KernelMessage.IIOPubMessage): void => {
    const msgType = msg.header.msg_type;
    switch (msgType) {
      case 'execute_input':
      case 'execute_result':
      case 'display_data':
        console.log("DISPLAY DATA:", msg.content)
      case 'stream':
          console.log("STREAMING:", msg.content)
      case 'update_display_data':
        // Once such a message is received by the future object, it can trigger an action.
        // In this case, that message is stored in this._output.
        // Then a stateChanged signal is emitted. The KernelModel has a stateChanged signal that will be used by the view.
        this._output = msg.content as IOutput;
        this._stateChanged.emit();
        break;
      default:
        break;
    }
    return;
  };

  private _future: Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | null = null;
  private _output: IOutput | null = null;
  private _sessionContext: ISessionContext;
  private _stateChanged = new Signal<KernelModel, void>(this);
}
