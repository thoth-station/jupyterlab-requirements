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

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { ICommandPalette } from '@jupyterlab/apputils';

// Customizations
import { ManageDependenciesButtonExtension } from './dependencyManagementButton';
import { KernelHandler } from './kernelHandlerMenu'

/**
 * The command IDs used by the console plugin.
 */
 export const commandIDs = {
  dependencyManagement: 'notebook:manage-dependencies',
  kernelHandler: 'kernel-handler: delete'
};

/**
 * Activate the JupyterLab extension.
 *
 * @param app Jupyter Front End
 */

/**
 * Initialization data for the jupyterlab_requirements extension.
 */

const extension: JupyterFrontEndPlugin<string> = {
  id: 'jupyterlab_requirements',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu],
  /**
   * Activate the JupyterLab extension.
   *
   * @param app Jupyter Front End
   * @param palette Jupyter Commands Palette
   * @param mainMenu Jupyter Menu
   * @param translator Jupyter Translator
   * @param launcher [optional] Jupyter Launcher
   */
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu,
  ) => {
    const { commands } = app;

    // Add button in notebook menu
    try {
      // ManageDependenciesButtonExtension initialization code
      const buttonExtension = new ManageDependenciesButtonExtension();
      app.docRegistry.addWidgetExtension('Notebook', buttonExtension);
      console.log('jupyterlab-requirements extension is activated!');
    } catch (reason) {
      console.error('Error on setting the jupyterlab-requirements extension');
    }

    // Add button in main menu
    const command = 'dependencies:kernel';

    function createPanel(): KernelHandler {
      const menu_extension = new KernelHandler();
      return menu_extension;
    }

    // Add a command
    commands.addCommand(command, {
      label: 'Kernel delete...',
      caption: 'Kernel delete...',
      execute: (args: any) => {
        createPanel();
      }
    });

    // Add the command to the command palette
    const category = 'Kernel';
    palette.addItem({
      command,
      category,
      args: { origin: 'from the palette' }
    });

    // Create a menu
    // TODO: Move to Kernel Group menu
    const tutorialMenu: Menu = new Menu({ commands });
    tutorialMenu.title.label = 'Dependencies';
    mainMenu.addMenu(tutorialMenu, { rank: 80 });

    // Add the command to the menu
    tutorialMenu.addItem({ command, args: { origin: 'from the menu' } });

    return "ready"
    }
};

export default extension;
