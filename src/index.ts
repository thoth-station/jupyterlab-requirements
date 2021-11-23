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
import { INotification } from "jupyterlab_toastify";

// Customizations
import { ManageDependenciesButtonExtension } from './dependencyManagementButton';
import { KernelHandler } from './kernelHandlerMenu'
import { Requirements, RequirementsLock } from "./types/requirements";
import { get_kernel_name } from "./notebook";
import { retrieve_config_file } from "./thoth";
import { get_dependencies, store_notebook_name } from "./kernel";

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

        var file_path = nbPanel.context.path
        store_notebook_name(file_path).then(message => {
          console.debug("storing file name", message)
        })

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

        notebookTracker.activeCellChanged.connect(() => {

          var track_change: boolean = false
          notebookTracker.activeCell.editor.model.value.changed.connect(() => {
            // user is typing
            if (( notebookTracker.activeCell.editor.model.value.text == "!pip" ) || ( notebookTracker.activeCell.editor.model.value.text == "%pip" )) {
              track_change = true
              INotification.error("Manage dependencies: please do not use direct pip commands. Use horus and/or the UI plugin instead.");
            }
          })

          if ( (notebookTracker.activeCell.editor.model.value.text.startsWith( "!pip" ) || notebookTracker.activeCell.editor.model.value.text.startsWith( "%pip" ) ) && ( track_change == false) ) {
            INotification.error("Manage dependencies: please do not use direct pip commands. Use `%horus convert` to convert your cells.");
          }

        });

        // Use new message introduced in https://github.com/jupyterlab/jupyterlab/pull/10493
        // NotebookActions.executionScheduled: Emitted when a notebook cell execution got scheduled/started.
        NotebookActions.executionScheduled.connect((sender, args) => {
          const { cell } = args;

          // Do not allow users to run pip from notebook cells
          if ( cell.editor.model.value.text.startsWith( "!pip" ) || cell.editor.model.value.text.startsWith( "%pip" ) ) {
            nbPanel.sessionContext.session.kernel.interrupt().then( _ => {
              INotification.error("Manage dependencies: please do not use direct pip commands. Use `%horus convert` to convert your cells.");
            })
          }
        })

        // Use new message introduced in https://github.com/jupyterlab/jupyterlab/pull/10493
        // NotebookActions.selectionExecuted: Emitted after all selected notebook cells completed execution successfully/unsuccessfully.
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
          }

          // Handle horus lock calls (lock + install and set-kernel)
          if ( cell.text.startsWith( "%horus lock" ) ) {
            const id = notebook.activeCellIndex
            const cell_ = notebook.model.cells.get(id - 1)
            const cell_response: {} = cell_.toJSON()
            const outputs = _.get(cell_response, "outputs")

            _.forEach(outputs, function(output) {

              try {
                  if ( _.size(output) > 0  && _.has(output, "data") ) {
                    console.debug("general output from cell", output)
                    const results: string = _.get(_.get(output, "data"), "text/plain")
                    const parsed_results = results.substr(1, results.length - 2)
                    let jsonObject: {} = JSON.parse(parsed_results);
                    console.debug("json object of the output", jsonObject)
                    const kernel_name: string = _.get(jsonObject, "kernel_name")
                    console.debug("kernel_name", kernel_name)
                    const resolution_engine: string = _.get(jsonObject, "resolution_engine")
                    console.debug("resolution_engine", resolution_engine)
                    const thoth_analysis_id: string = _.get(jsonObject, "thoth_analysis_id")
                    console.debug("thoth_analysis_id", thoth_analysis_id)

                    let notebook_metadata = notebook.model.metadata
                    notebook_metadata.set('dependency_resolution_engine', resolution_engine)

                    if ( resolution_engine == "thoth" ) {
                      retrieve_config_file(kernel_name).then(thoth_config  => {
                          notebook_metadata.set('thoth_config', JSON.stringify(thoth_config))
                      })
                      notebook_metadata.set('thoth_analysis_id', thoth_analysis_id)
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

              } catch ( error ) {
                console.debug("Error parsing output", error)
              }

            })

          }

          // Handle horus set-kernel calls
          if ( cell.text.startsWith( "%horus set-kernel" ) ) {
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
                const kernel_name: string = _.get(jsonObject, "kernel_name")
                console.debug("kernel_name", kernel_name)

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

          }

          // Handle horus discover calls
          if ( cell.text.startsWith( "%horus discover" ) ) {
            const id = notebook.activeCellIndex
            const cell_ = notebook.model.cells.get(id - 1)
            const cell_response: {} = cell_.toJSON()
            const outputs = _.get(cell_response, "outputs")

            _.forEach(outputs, function(output) {
              console.log(output)
              if ( _.size(output) > 0  && _.has(output, "data") ) {
                let notebook_metadata = notebook.model.metadata

                const results: string = _.get(_.get(output, "data"), "text/plain")
                const parsed_results = results.substr(1, results.length - 2)
                console.log(parsed_results)
                let jsonObject: {} = JSON.parse(parsed_results);
                const requirements: Requirements = _.get(jsonObject, "requirements")
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
            })
          }

          // Handle horus convert calls
          if ( cell.text == "%horus convert" ) {

            // Clean notebook content from cells that use !pip install
            let number_of_cells = nbPanel.model.cells.length
            var array = _.range(0, number_of_cells);

            // Iterate over cells
            let cells = notebook.model.cells

            _.each(array, function (cell_number, key) {
              let cell = notebook.model.cells.get(cell_number)
              console.debug(cell)

              if ( (cell.type === "code") && ( cell.value.text.startsWith( "!pip" ) || cell.value.text.startsWith( "%pip" )) ) {
                  const cell_text = cell.value.text

                  console.debug("cell n.", cell_number, cell_text);

                  // Handle case with !pip | %pip install -r requirements.txt
                  // Handle case with !pip | %pip install -r /folder/requirements.txt
                  // Handle case with !pip | %pip install /path/to/my_package.whl
                  // Handle case with !pip | %pip install git+https://github.com/...
                  if ( cell.value.text.includes(".txt") || cell.value.text.includes(".git+https") || cell.value.text.includes(".whl") ) {
                    var new_text = "#" + cell.value.text
                  }
                  else if ( cell.value.text.startsWith( "!pip install" ) || cell.value.text.startsWith( "%pip install" ) ) {

                    // Handle case with !pip | %pip install <package name>
                    // Handle case with !pip | %pip install <package name> <package name>
                    // Handle case with !pip | %pip install <package name> <package name> <package name>

                    const regex = /[!%]pip install ([a-zA-Z0-9_.-]*) ?([a-zA-Z0-9_.-]*) ?([a-zA-Z0-9_.-]*)/g;
                    const found = cell_text.match(regex);
                    console.debug(found)

                    let commented_commands: Array<string> = []
                    let packages: Array<string> = []

                    _.each(found, function (match, key) {
                      commented_commands.push(match)
                      _.each(_.range(2, match.length), function (package_number, key) {

                        const package_matched = match.split(" ")[package_number]
                        console.debug(package_matched)
                        packages.push(package_matched)
                      })

                    })

                    // Remove ALL empty values ("", null, undefined and 0)
                    packages = packages.filter(function(e){return e});
                    var new_text = "#" + commented_commands.join("\n#") + "\n" + "%horus requirements --add " + packages.join(" ")

                  }
                  else {
                    // Handle other cases with !pip | %pip (e.g. !pip freeze)
                    var new_text = "#" + cell.value.text
                  }

                  console.debug("new cell text", new_text)

                  // Instantiate a new empty cell
                  const new_cell = nbPanel.model.contentFactory.createCell(
                    cell.type,
                    {}
                  );

                  new_cell.value.text = new_text;
                  cells.remove(cell_number)
                  cells.insert(cell_number, new_cell)
              }

            });

            INotification.info("Manage dependencies: Notebook cells using pip have been converted to cells with %horus commands.");

          }

        });

        session.kernelChanged.connect((sender) => {

          const code: string = "%load_ext jupyterlab_requirements"
          session.kernel.requestExecute({
            code
          })
        })

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
    const command = commandIDs.kernelHandler;;

    function createPanel(): KernelHandler {
      const menu_extension = new KernelHandler();
      return menu_extension;
    }

    // Add a command
    commands.addCommand(command, {
      label: 'Delete Kernel...',
      caption: 'Delete Kernel...',
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

    if ( mainMenu ) {
      // Add command to Kernel Group
      mainMenu.kernelMenu.addGroup( [{ command }], 30 )
    }

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
