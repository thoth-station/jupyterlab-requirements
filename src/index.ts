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
import { INotification } from "jupyterlab_toastify";

// Customizations
import { ManageDependenciesButtonExtension } from './dependencyManagementButton';
import { KernelHandler } from './kernelHandlerMenu'
import { Requirements, RequirementsLock } from "./types/requirements";
import { ThothConfig } from "./types/thoth";
import { get_kernel_name } from "./notebook";
import { retrieve_config_file } from "./thoth";
import { get_dependencies } from "./kernel";

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
          console.debug("kernel approved: ", kernel.name.toString())
        }

        // Load magic commands extension automatically for the user.
        const code: string = "%load_ext jupyterlab_requirements"
        kernel.requestExecute({
          code
        })

        console.log('loaded horus magic command extension');

        // Use new message introduced in https://github.com/jupyterlab/jupyterlab/issues/10259
        NotebookActions.selectionExecuted.connect((sender, args) => {
          const { lastCell, notebook } = args;
          const cell = lastCell.model.value

          // Handle horus requirements calls
          if ( cell.text.startsWith( "%horus requirements" ) ) {
              const id = notebook.activeCellIndex
              const cell_ = notebook.model.cells.get(id - 1)
              const cell_response: {} = cell_.toJSON()
              const outputs = _.get(cell_response, "outputs")

              if ( _.size(outputs) > 0  && _.has(outputs[0], "data") ) {
                let notebook_metadata = notebook.model.metadata

                const requirements: string = _.get(_.get(outputs[0], "data"), "text/plain")
                const parsed_req = requirements.substr(1, requirements.length - 2)
                let jsonObject: Requirements = JSON.parse(parsed_req);
                notebook_metadata.set('requirements', JSON.stringify(jsonObject))
              }

              nbPanel.context.save()
          }

          // Handle horus lock calls (lock + install and set-kernel)
          if ( cell.text.startsWith( "%horus lock" ) ) {
            const id = notebook.activeCellIndex
            const cell_ = notebook.model.cells.get(id - 1)
            const cell_response: {} = cell_.toJSON()
            const outputs = _.get(cell_response, "outputs")

            _.forEach(outputs, function(output) {
              if ( _.size(output) > 0  && _.has(output, "data") ) {
                console.debug(output)
                const results: string = _.get(_.get(output, "data"), "text/plain")
                const parsed_results = results.substr(1, results.length - 2)
                let jsonObject: {} = JSON.parse(parsed_results);
                console.debug("output", jsonObject)
                console.debug(typeof jsonObject)
                const kernel_name: string = _.get(jsonObject, "kernel_name")
                console.debug("kernel_name", kernel_name)
                const resolution_engine: string = _.get(jsonObject, "resolution_engine")
                console.debug("resolution_engine", resolution_engine)

                let notebook_metadata = notebook.model.metadata
                notebook_metadata.set('dependency_resolution_engine', resolution_engine)

                if ( resolution_engine == "thoth" ) {
                  let thoth_config: Promise<ThothConfig> = retrieve_config_file(kernel_name)
                  notebook_metadata.set('thoth_config', JSON.stringify(thoth_config))
                }

                get_dependencies(kernel_name).then(value => {
                  const requirements: Requirements = _.get(value, "requirements")
                  console.debug("Pipfile", requirements)
                  const requirements_lock: RequirementsLock = _.get(value, "requirements_lock")
                  console.debug("Pipfile.lock", requirements_lock)
                  notebook_metadata.set('requirements', JSON.stringify(requirements))
                  notebook_metadata.set('requirements_lock', JSON.stringify(requirements_lock))
                })

                // Check if kernel name is already assigned to notebook and if yes, do nothing
                const current_kernel = get_kernel_name( nbPanel, true )
                if ( current_kernel == kernel_name ) {
                  INotification.info("kernel name to be assigned " + kernel_name + " already set for the current notebook (" + current_kernel + "). Kernel won't be restarted.")
                }
                else {
                  nbPanel.sessionContext.session.changeKernel({"name": kernel_name})
                }
              }
            })
              nbPanel.context.save()
          }

          // Handle horus discover calls
          if ( cell.text.startsWith( "%horus discover" ) ) {
            const id = notebook.activeCellIndex
            const cell_ = notebook.model.cells.get(id - 1)
            const cell_response: {} = cell_.toJSON()
            const outputs = _.get(cell_response, "outputs")

            if ( _.size(outputs) > 0  && _.has(outputs[0], "data") ) {
              let notebook_metadata = notebook.model.metadata

              const results: string = _.get(_.get(outputs[0], "data"), "text/plain")
              const parsed_results = results.substr(1, results.length - 2)
              let jsonObject: {} = JSON.parse(parsed_results);
              const requirements: Requirements = _.get(jsonObject, "resolution_engine")
              const force: boolean = _.get(jsonObject, "force")

              if ( !notebook_metadata.has('requirements') || force == true) {
                notebook_metadata.set('requirements', JSON.stringify(requirements))
              }
              else {
                kernel.requestExecute({
                  code: "print('requirements already exist in notebook metadata, use --force to overwrite them!')"
                })
              }
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
