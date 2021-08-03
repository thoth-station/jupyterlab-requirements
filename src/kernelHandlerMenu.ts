/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Francesco Murdaca <fmurdaca@redhat.com>
 * @since  0.8.0
 */

import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { KernelHandlerWidget } from './components/KernelHandlerDialog';
import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

/**
 * Kernel Handler.
 */
export class KernelHandler extends Widget {
    constructor() {
    super();
    this.id = 'kernel-handler-extension';
    this.title.closable = true;

    this._kernel_handler = ReactWidget.create(
        React.createElement(KernelHandlerWidget, {})
    );

    const ui = {
        title: 'Delete Kernel',
        body: this._kernel_handler,
        buttons: [Dialog.cancelButton()]
    };

    const dialog = new Dialog(ui);
    dialog.launch();

    }

    private _kernel_handler: ReactWidget;
}
