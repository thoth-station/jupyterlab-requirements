
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
 * The class name added to the thoth config collapsible button (CSS).
 */
const THOTH_CONFIG_BUTTON_CLASS = "thoth-config-button";

/**
 * Class: Holds properties for DependencyManagementInstallButton.
 */

interface IProps {
    changeUIStatus: Function,
    install: Function
  }

/**
 * A React Component to show options button for Thoth configuration.
 */

export class DependencyManagementThothConfigOptionsButton extends React.Component<IProps> {
    constructor(props: IProps) {
      super(props);

    }

    showOptions() {
      this.props.install()
    }

    render() {
      return (
            <button
            title='Thoth configuration options'
            className={THOTH_CONFIG_BUTTON_CLASS}
            type="button"
            >
            Options
            </button>
      );
  }
}
