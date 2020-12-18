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

import { addIcon, editIcon, deleteIcon, installedIcon, notInstalledIcon } from '../icons';


/**
 * (CSS).
 */
const THOTH_PACKAGE_NAME_INPUT = "thoth-package-name-input";
const THOTH_CONSTRAINT_INPUT = "thoth-constraint-input";
const THOTH_ROW_BUTTON = "thoth-row-button";
const THOTH_ROW_BUTTON_DEACTIVATED = "thoth-row-button-deactivated";

/**
 * Class: Holds properties for DependencyManagementTable.
 */
export interface IProps {
    name: string;
    version: string;
    installed: string;
    packages: {
        [name: string]: string;
    };
    editSavedRow: Function;
    deleteSavedRow: Function;
}
export interface IState {
    name: string;
    version: string;
}

/**
 * A React Component for dependency management table row.
 */
export class DependencyManagementTableRowSaved extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            name: "",
            version: "*"
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleItemDeleted = this.handleItemDeleted.bind(this);
        this.handleItemEdited = this.handleItemEdited.bind(this);
        this.showIfInstalled = this.showIfInstalled.bind(this);
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.name == "package_name")
            this.setState({
                name: event.target.value
            });
        if (event.target.name == "package_version")
            this.setState({
                version: event.target.value
            });
    }

    handleItemDeleted(package_name: string) {
        this.props.deleteSavedRow(package_name);
    }

    handleItemEdited(package_name: string, package_version: string) {
        this.props.editSavedRow(package_name, package_version);
    }

    showIfInstalled(isInstalled: string) {

        if ( isInstalled == "Y" ) {

            return <installedIcon.react
            elementPosition="center"
            width="30px"
            height="30px"
        />;

        }

        else {
            return <notInstalledIcon.react
                        elementPosition="center"
                        width="30px"
                        height="30px"
                    />;
        }


    }

    render() {
        var context = this;
        return (
            <tr>
                <td>
                    <input
                        name='package_name'
                        type='text'
                        value={this.props.name}
                        className={THOTH_PACKAGE_NAME_INPUT}
                        disabled={true}
                    >
                    </input>
                </td>
                <td>
                    <input
                        name='package_version'
                        type='text'
                        value={this.props.version}
                        className={THOTH_CONSTRAINT_INPUT}
                        disabled={true}
                    >
                    </input>
                </td>
                <td>
                    {context.showIfInstalled(this.props.installed)}
                </td>
                <td>
                    <td>
                        <button
                            title='Add package'
                            className={THOTH_ROW_BUTTON_DEACTIVATED}
                            type="button"
                            disabled={true}
                            >
                            <addIcon.react
                                elementPosition="center"
                                width="20px"
                                height="20px"
                                display="inline-block"
                            />
                        </button>
                    </td>
                    <td>
                        <button
                            title='Edit saved package'
                            className={THOTH_ROW_BUTTON}
                            type="button"
                            onClick={context.handleItemEdited.bind(context, this.props.name, this.props.version)}
                            >
                            <editIcon.react
                                elementPosition="center"
                                width="20px"
                                height="20px"
                                display="inline-block"
                            />
                        </button>
                    </td>
                    <td>
                        <button
                            title='Delete saved package'
                            className={THOTH_ROW_BUTTON}
                            type="button"
                            onClick={context.handleItemDeleted.bind(context, this.props.name)}
                            >
                            <deleteIcon.react
                                elementPosition="center"
                                width="20px"
                                height="20px"
                                display="inline-block"
                            />
                        </button>
                    </td>
                </td>
            </tr>
        );
    }
}
