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

// JupyterLab
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  INotebookTracker,
  NotebookActions,
  NotebookPanel
} from '@jupyterlab/notebook';

import { Kernel } from '@jupyterlab/services';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ICommandPalette } from '@jupyterlab/apputils';
import { Menu } from '@lumino/widgets';

// Customizations
import { ManageDependenciesButtonExtension } from './dependencyManagementButton';
import { KernelHandler } from './kernelHandlerMenu'
import { Requirements } from "./types/requirements";

/**
 * The command IDs used by the console plugin.
 */
 export const commandIDs = {
  dependencyManagement: 'notebook:manage-dependencies',
  kernelHandler: 'kernel-handler: delete'
};

const PLUGIN_ID = 'jupyterlab_requirements'

/**
 * The dask dashboard extension.
 */
 const extension: JupyterFrontEndPlugin<void> = {
  activate,
  id: PLUGIN_ID,
  requires: [
    ICommandPalette,
    IMainMenu,
    INotebookTracker
  ],
  autoStart: true
};

/**
 * Export the extension as default.
 */
export default extension;

/**
   * Activate the JupyterLab extension.
   *
   * @param app Jupyter Front End
   * @param commandPalette Jupyter Commands Palette
   * @param mainMenu Jupyter Menu
   * @param notebookTracker INotebookTracker
*/
async function activate(
    app: JupyterFrontEnd,
    commandPalette: ICommandPalette,
    mainMenu: IMainMenu,
    notebookTracker: INotebookTracker
  ): Promise<void> {
    const { commands } = app;

    // Load automatically Horus magic commands when starting notebook
    notebookTracker.widgetAdded.connect((sender, nbPanel: NotebookPanel) => {
      const sessionContext = nbPanel.sessionContext;

      sessionContext.ready.then(() => {
        const session = sessionContext.session;
        let kernel = session.kernel;
        // Check to see if we found a kernel, and if its language is python.
        if (!(ThothPrivate.shouldUseKernel(kernel))) {
          console.log("kernel approved: ", kernel.name.toString())
        }

        const code: string = "%load_ext jupyterlab_requirements"
        kernel.requestExecute({
          code
        })

        console.log('loaded horus magic command extension');

        // Use new message introduced in https://github.com/jupyterlab/jupyterlab/issues/10259
        NotebookActions.selectionExecuted.connect((sender, args) => {
          const { lastCell, notebook } = args;
          const cell = lastCell.model.value

          if ( cell.text.startsWith( "%horus requirements" ) ) {
              console.log("special cell", cell)
              const id = notebook.activeCellIndex
              const cell_ = notebook.model.cells.get(id - 1)
              const cell_response: {} = cell_.toJSON()
              const outputs = _.get(cell_response, "outputs")

              let notebook_metadata = notebook.model.metadata

              if ( _.size(outputs) > 0 ) {
                const requirements: string = _.get(_.get(outputs[0], "data"), "text/plain")
                const parsed_req = requirements.substr(1, requirements.length - 2)
                let jsonObject: Requirements = JSON.parse(parsed_req);
                notebook_metadata.set('requirements', JSON.stringify(jsonObject))
              }

              nbPanel.context.save()
            }
        });

      });
    });

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
    commandPalette.addItem({
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
};

namespace ThothPrivate {

  /**
   * Consider only valid Python kernels.
   */
    export async function shouldUseKernel(
      kernel: Kernel.IKernelConnection | null | undefined
    ): Promise<boolean> {
      if (!kernel) {
        return false;
      }
      const spec = await kernel.spec;
      return !!spec && spec.language.toLowerCase().indexOf('python') !== -1;
    }

}
