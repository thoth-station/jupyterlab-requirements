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
    changeUIstate: Function;
    onSave: Function;
}
/**
 * A React Component for install button for dependency management.
 */
export declare class DependencyManagementSaveButton extends React.Component<IProps> {
    constructor(props: IProps);
    saveRequirements(): void;
    render(): JSX.Element;
}
export {};
