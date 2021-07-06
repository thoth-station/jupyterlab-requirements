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

import { LabIcon } from '@jupyterlab/ui-components';
import saveSvgstr from '../../style/icons/save.svg';

/**
 * Class: Save icon.
 */
export const saveIcon = new LabIcon({
  name: 'thoth:save-button-icon',
  svgstr: saveSvgstr
});


/**
 * Class: Holds properties for DependencyManagementSaveButton.
 */
interface IProps {
    onSave: Function;
}

/**
 * The class name added to the save button (CSS).
 */
const SAVE_BUTTON_CLASS = "thoth-save-button";

/**
 * A React Component for save button for dependency management.
 */
export class DependencyManagementSaveButton extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);
    }
    saveRequirements() {
        this.props.onSave();
    }
    render() {
        return (
            <button
            title='Save dependencies'
            className={SAVE_BUTTON_CLASS}
            type="button"
            onClick={this.saveRequirements.bind(this)}
            >
            <saveIcon.react
                tag="div"
                elementPosition="center"
                right="7px"
                top="5px"
                width="20px"
                height="20px"
            />
            </button>
        );
      }
}
