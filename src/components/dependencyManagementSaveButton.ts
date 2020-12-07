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
import * as React from 'react';
// import {
//   LabIcon,
// } from '@jupyterlab/ui-components';

/**
 * Class: Holds properties for DependencyManagementInstallButton.
 */
interface IProps {
    changeUIstate: Function;
    onSave: Function;
}

/**
 * The class name added to the install button (CSS).
 */
const SAVE_BUTTON_CLASS = "thoth-save-button";
/**
 * A React Component for install button for dependency management.
 */
export class DependencyManagementSaveButton extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    saveRequirements() {
        this.props.onSave();
    }
    render() {
        return (React.createElement("button", { title: 'Save dependencies', className: SAVE_BUTTON_CLASS, onClick: this.saveRequirements.bind(this) }, "Save"));
    }
}
