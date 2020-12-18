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

import { addIcon } from '../icons';


/**
 * The class name added to the new package button (CSS).
 */

const NEW_PACKAGE_BUTTON_CLASS = "thoth-new-package-button";

/**
 * Class: Holds properties for DependencyManagementNewPackageButton.
 */
interface IProps {
    addNewRow: Function;
}
/**
 * A React Component for add package button for dependency management.
 */

export class DependencyManagementNewPackageButton extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    addNewEmptyRow() {
        this.props.addNewRow();
    }
    render() {
        return (
            <button
                    title='Add new line! Only one empty line is displayed.'
                    className={NEW_PACKAGE_BUTTON_CLASS}
                    type="button"
                    onClick={this.addNewEmptyRow.bind(this)}
                    >
                    <addIcon.react
                        tag="div"
                        elementPosition="center"
                        width="20px"
                        height="20px"
                        display="inline-block"
                    />
            </button>
            );
    }
}
