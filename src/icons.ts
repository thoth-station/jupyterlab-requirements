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

import { LabIcon } from '@jupyterlab/ui-components';
import addSvgstr from '../style/icons/add.svg';
import editSvgstr from '../style/icons/edit.svg';
import deleteSvgstr from '../style/icons/delete.svg';
import installedSvgstr from '../style/icons/installed.svg';
import notInstalledSvgstr from '../style/icons/not-installed.svg';


/**
 * Class: Add icon.
 */
export const addIcon = new LabIcon({
    name: 'thoth:add-button-icon',
    svgstr: addSvgstr
});

/**
 * Class: Edit icon.
 */
export const editIcon = new LabIcon({
  name: 'thoth:edit-button-icon',
  svgstr: editSvgstr
});

/**
 * Class: Delete icon.
 */
export const deleteIcon = new LabIcon({
    name: 'thoth:delete-button-icon',
    svgstr: deleteSvgstr
});

/**
 * Class: installed icon.
 */
export const installedIcon = new LabIcon({
    name: 'thoth:installed-icon',
    svgstr: installedSvgstr
  });

/**
 * Class: Not installed icon.
 */
export const notInstalledIcon = new LabIcon({
    name: 'thoth:not-installed-icon',
    svgstr: notInstalledSvgstr
});
