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
    render() {
        var context = this;
        return (React.createElement("tr", null,
            React.createElement("td", null,
                React.createElement("input", { className: THOTH_PACKAGE_NAME_INPUT, disabled: true, type: "text", name: "package_name", value: this.props.name })),
            React.createElement("td", null,
                React.createElement("input", { className: THOTH_CONSTRAINT_INPUT, disabled: true, type: "text", name: "package_version", value: this.props.version })),
            React.createElement("td", null, this.props.installed),
            React.createElement("td", null,
                React.createElement("td", null,
                    React.createElement("button", { className: THOTH_ROW_BUTTON_DEACTIVATED }, "Add")),
                React.createElement("td", null,
                    React.createElement("button", { title: 'Edit saved package', className: THOTH_ROW_BUTTON, onClick: context.handleItemEdited.bind(context, this.props.name, this.props.version) }, "Edit")),
                React.createElement("td", null,
                    React.createElement("button", { title: 'Delete saved package', className: THOTH_ROW_BUTTON, onClick: context.handleItemDeleted.bind(context, this.props.name) }, "Delete")))));
    }
}
