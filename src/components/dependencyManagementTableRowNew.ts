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
// const THOTH_INSTALLED_PACKAGE = "thoth-installed-package"
// const THOTH_NOT_INSTALLED_PACKAGE = "thoth-not-installed-package"


/**
 * Class: Holds properties for DependencyManagementTable.
 */
export interface IProps {
    name: string;
    installed: string;
    packages: {
        [name: string]: string;
    };
    storeRow: Function;
    deleteRow: Function;
}
export interface IState {
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
            name: "",
            version: "*"
        };
        this.handleItemAdded = this.handleItemAdded.bind(this);
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
    handleItemAdded() {
        var package_name = this.state.name.toString();
        var package_version = this.state.version.toString();
        this.props.storeRow(package_name, package_version);
    }
    handleItemDeleted(package_name: string) {
        this.props.deleteRow(package_name);
    }
    render() {
        var context = this;
        return (React.createElement("tr", null,
            React.createElement("td", null,
                React.createElement("input", { className: THOTH_PACKAGE_NAME_INPUT, type: "text", name: "package_name", value: this.state.name, onChange: this.handleChange })),
            React.createElement("td", null,
                React.createElement("input", { className: THOTH_CONSTRAINT_INPUT, type: "text", name: "package_version", value: this.state.version, onChange: this.handleChange })),
            React.createElement("td", null, this.props.installed),
            React.createElement("td", null,
                React.createElement("td", null,
                    React.createElement("button", { title: 'Include new package', className: THOTH_ROW_BUTTON, onClick: context.handleItemAdded.bind(context) }, "Add")),
                React.createElement("td", null,
                    React.createElement("button", { className: THOTH_ROW_BUTTON_DEACTIVATED }, "Edit")),
                React.createElement("td", null,
                    React.createElement("button", { title: 'Delete new package', className: THOTH_ROW_BUTTON, onClick: context.handleItemDeleted.bind(context, this.state.name) }, "Delete")))));
    }
}
