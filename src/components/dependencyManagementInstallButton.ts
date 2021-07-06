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
/**
 * Class: Holds properties for DependencyManagementInstallButton.
 */
interface IProps {
    install: Function;
}
/**
 * The class name added to the install button (CSS).
 */
const INSTALL_BUTTON_CLASS = "thoth-install-button";

/**
 * A React Component for install button for dependency management.
 */
export class DependencyManagementInstallButton extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    onInstall() {
        this.props.install();
    }
    render() {
        return (React.createElement("button", { title: 'Install dependencies', className: INSTALL_BUTTON_CLASS, onClick: this.onInstall.bind(this) }, "Install"));
    }
}
