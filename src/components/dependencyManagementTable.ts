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
import _ from "lodash";
import * as React from 'react';
import { DependencyManagementTableRowSaved } from './dependencyManagementTableRowSaved';
import { DependencyManagementTableRowNew } from './dependencyManagementTableRowNew';
/**
 * The id for thoth table (CSS).
 */
const THOTH_TABLE = "thoth-table";

/**
 * Class: Holds properties for DependencyManagementTable.
 */
export interface IProps {
    packages: {
        [name: string]: string;
    };
    initial_packages: {
        [name: string]: string;
    };
    installed_packages: {
        [name: string]: string;
    };
    storeRow: Function;
    deleteRow: Function;
    editSavedRow: Function;
    deleteSavedRow: Function;
}
export interface IState {
    headers: Array<string>;
}

/**
 * A React Component for dependency management table.
 */
export class DependencyManagementTable extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            headers: [
                "Package",
                "Constraint",
                "Installed",
                "Actions"
            ]
        };
    }
    renderTableHeader() {
        return this.state.headers.map((key, index) => {
            return React.createElement("th", { key: index }, key.toUpperCase());
        });
    }
    renderRows() {
        var context = this;
        var packages = this.props.packages;
        var initial_packages = this.props.initial_packages;
        var installed_packages = this.props.installed_packages;
        var rows = [];
        for (let [name, version] of Object.entries(initial_packages)) {
            if (_.has(installed_packages, name)) {
                rows.push(
                    React.createElement(DependencyManagementTableRowSaved,
                        {
                            name: name,
                            version: version,
                            installed: "Y",
                            packages: packages,
                            editSavedRow: context.props.editSavedRow,
                            deleteSavedRow: context.props.deleteSavedRow
                        }));
            }
            else {
                rows.push(
                    React.createElement(DependencyManagementTableRowSaved,
                        {
                            name: name,
                            version: version,
                            installed: "N",
                            packages: packages,
                            editSavedRow: context.props.editSavedRow,
                            deleteSavedRow: context.props.deleteSavedRow
                        }));
            }
        }
        for (let [name, _] of Object.entries(packages)) {
            rows.push(
                React.createElement(DependencyManagementTableRowNew,
                    {
                        name: name,
                        installed: "N",
                        packages: packages,
                        storeRow: context.props.storeRow,
                        deleteRow: context.props.deleteRow
                    }));
        }
        return rows;
    }
    render() {
        return (React.createElement("table", { id: THOTH_TABLE, className: THOTH_TABLE },
            React.createElement("thead", null, this.renderTableHeader()),
            React.createElement("tbody", null, this.renderRows())));
    }
}
