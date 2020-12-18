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
    installed: string;
    packages: {
        [name: string]: string;
    };
    editRow: Function;
    storeRow: Function;
    deleteRow: Function;
}
export interface IState {
    isAdded: boolean;
    isEditable: boolean;
    name: string;
    version: string;
}

/**
 * A React Component for dependency management table row.
 */
export class DependencyManagementTableRowNew extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            isAdded: false,
            isEditable: false,
            name: "",
            version: "*"
        };
        this.handleItemAdded = this.handleItemAdded.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleItemDeleted = this.handleItemDeleted.bind(this);
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

    handleItemAdded() {
        var package_name = this.state.name.toString();
        var package_version = this.state.version.toString();
        this.props.storeRow(package_name, package_version);
        this.setState(
            {
                isAdded: true,
                isEditable: true
            }
        );
    }

    handleItemDeleted(package_name: string) {
        this.props.deleteRow(package_name);
    }

    showIfInstalled(isInstalled: string) {

        if ( isInstalled == "Y" ) {

            return <installedIcon.react
            tag="div"
            elementPosition="center"
            width="30px"
            height="30px"
            display="inline-block"
        />;

        }

        else {
            return <notInstalledIcon.react
                        tag="div"
                        elementPosition="center"
                        width="30px"
                        height="30px"
                        display="inline-block"
                    />;
        }


    }

    handleItemEdited(package_name: string) {
        this.props.editRow(package_name);
        this.setState(
            {
                isAdded: false,
                isEditable: false
            }
        );
    }

    render() {
        var context = this;

        const isAdded = this.state.isAdded;

        let addButton;

        if (isAdded) {
            addButton = <button
                        title='Include new package'
                        className={THOTH_ROW_BUTTON_DEACTIVATED}
                        type="button"
                        disabled={true}
                        >
                        <addIcon.react
                            tag="div"
                            elementPosition="center"
                            width="20px"
                            height="20px"
                            display="inline-block"
                        />
                    </button>;
        } else {
            addButton = <button
                        title='Include new package'
                        className={THOTH_ROW_BUTTON}
                        type="button"
                        onClick={context.handleItemAdded.bind(context)}
                        >
                        <addIcon.react
                            tag="div"
                            elementPosition="center"
                            width="20px"
                            height="20px"
                            display="inline-block"
                        />
                    </button>;
        }

        const isEditable = this.state.isEditable;

        let editButton;

        if (isEditable) {
            editButton =  <button
                                title='Edit package'
                                className={THOTH_ROW_BUTTON}
                                type="button"
                                onClick={context.handleItemEdited.bind(context, this.state.name)}
                                >
                                <editIcon.react
                                    tag="div"
                                    elementPosition="center"
                                    width="20px"
                                    height="20px"
                                    display="inline-block"
                                />
                        </button>;
        } else {
            editButton =  <button
                                title='Edit package'
                                className={THOTH_ROW_BUTTON_DEACTIVATED}
                                type="button"
                                disabled={true}
                                >
                                <editIcon.react
                                    tag="div"
                                    elementPosition="center"
                                    width="20px"
                                    height="20px"
                                    display="inline-block"
                                />
                        </button>;
        }

        return (
            <tr>
                <td>
                    <input
                        name='package_name'
                        type='text'
                        value={this.state.name}
                        className={THOTH_PACKAGE_NAME_INPUT}
                        onChange={this.handleChange}
                    >
                    </input>
                </td>
                <td>
                    <input
                        name='package_version'
                        type='text'
                        value={this.state.version}
                        className={THOTH_CONSTRAINT_INPUT}
                        onChange={this.handleChange}
                    >
                    </input>
                </td>
                <td>
                    {context.showIfInstalled(this.props.installed)}
                </td>
                <td>
                    <td>
                        {addButton}
                    </td>
                    <td>
                        {editButton}
                    </td>
                    <td>
                        <button
                            title='Delete new package'
                            className={THOTH_ROW_BUTTON}
                            type="button"
                            onClick={context.handleItemDeleted.bind(context, this.state.name)}
                            >
                            <deleteIcon.react
                                tag="div"
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
