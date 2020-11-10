/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Francesco Murdaca <fmurdaca@redhat.com>
 * @since  0.1.0
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { ILauncher } from '@jupyterlab/launcher';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { ITranslator } from '@jupyterlab/translation';

import { Menu } from '@lumino/widgets';

import { SignalExamplePanel } from './panel';

/**
 * The command IDs used by the console plugin.
 */
namespace CommandIDs {
  export const create = 'examples-signals:create';
}

/**
 * Initialization data for the jupyterlab_requirements extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_requirements',
  autoStart: true,
  optional: [ILauncher],
  requires: [ICommandPalette, IMainMenu, ITranslator],
  activate
};

/**
 * Activate the JupyterLab extension.
 *
 * @param app Jupyter Font End
 * @param palette Jupyter Commands Palette
 * @param mainMenu Jupyter Menu
 * @param translator Jupyter Translator
 * @param launcher [optional] Jupyter Launcher
 */
function activate(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  mainMenu: IMainMenu,
  translator: ITranslator,
  launcher: ILauncher | null
): void {
  const manager = app.serviceManager;
  const { commands, shell } = app;
  const category = 'Notebook';
  const trans = translator.load('jupyterlab');

  // Add launcher
  if (launcher) {
    launcher.add({
      command: CommandIDs.create,
      category: category
    });
  }

  /**
   * Creates a example panel.
   *
   * @returns The panel
   */
  function createPanel(): Promise<SignalExamplePanel> {
    let panel: SignalExamplePanel;
    return manager.ready.then(() => {
      panel = new SignalExamplePanel(translator);
      shell.add(panel, 'main');
      return panel;
    });
  }

  // Add menu tab
  const signalMenu = new Menu({ commands });
  signalMenu.title.label = trans.__('Signal Example');
  mainMenu.addMenu(signalMenu);

  // Add commands to registry
  commands.addCommand(CommandIDs.create, {
    label: trans.__('Thoth Station WIP'),
    caption: trans.__('Thoth Station WIP'),
    execute: createPanel
  });

  // Add items in command palette and menu
  palette.addItem({ command: CommandIDs.create, category });
  signalMenu.addItem({ command: CommandIDs.create });
}

export default extension;