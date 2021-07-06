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


import _ from "lodash";
import * as React from 'react';

import { LabIcon } from '@jupyterlab/ui-components';
import deleteSvgstr from '../../style/icons/delete.svg';
import { IKernelHandlerState } from './KernelHandlerDialog';

/**
 * Class: Save icon.
 */
export const saveIcon = new LabIcon({
  name: 'thoth:delete-button-icon',
  svgstr: deleteSvgstr
});


/**
 * Class: Holds properties for KernelHandlerDeleteButton.
 */
interface IProps {
    onDeleteKernel: Function,
    ui_state: IKernelHandlerState,
    changeUIstate: Function
}

/**
 * The class name added to the delete button (CSS).
 */
const DELETE_BUTTON_CLASS = "thoth-kernel-delete-button";

/**
 * A React Component for delete button for kernel handler.
 */
export class KernelHandlerDeleteButton extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    async deleteKernel() {

        const current_state = this.props.ui_state
        _.set(current_state, "status", "delete")
        this.props.changeUIstate(current_state)

        const new_ui_state = await this.props.onDeleteKernel(
            this.props.ui_state.kernel_name,
            this.props.ui_state.kernels,
            this.props.ui_state
        );
        this.props.changeUIstate(new_ui_state)
    }
    render() {
        return (
            <button
            title='Delete kernel'
            className={DELETE_BUTTON_CLASS}
            type="button"
            onClick={this.deleteKernel.bind(this)}
            >
            <saveIcon.react
                tag="div"
                elementPosition="center"
                right="7px"
                top="5px"
                width="20px"
                height="20px"
            />
            </button>
        );
      }
}
