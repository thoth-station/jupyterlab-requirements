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

import _ from "lodash"

import { NotebookPanel } from '@jupyterlab/notebook';

import { Source, Requirements, RequirementsLock } from './types/requirements';
import { ThothConfig } from "./types/thoth";
import { get_discovered_python_version } from "./helpers";
import * as utils from "./utils";

/**
 * Function: Get Python version from language information.
 */
export function get_python_version( notebook: NotebookPanel ): string {
    const language_info = notebook.content.model.metadata.get( 'language_info' )
    console.debug('language_info:', language_info)

    const python_version: string = _.get(language_info, "version")

    console.debug('python version identified:', python_version)

    if ( python_version == null ) {
        console.debug( `Python version '${ python_version }' is null.` )
        return null
    }

    const match = python_version.match( /\d.\d/ )
    console.debug('match identified:', match)

    if ( match == null ) {
        throw new Error( `Python version '${ python_version }' does not match required pattern.` )
    }

    return match[ 0 ]
}

/**
 * Function: Get kernel name from kernel spec.
 */
export function get_kernel_name( notebook: NotebookPanel , is_final: boolean = false): string {
    const kernelspec = notebook.content.model.metadata.get( 'kernelspec' )
    console.debug('kernel info:', kernelspec)

    const kernel_name = _.get(kernelspec, "name")

    console.debug('kernel_name identified:', kernel_name)

    if ( (kernel_name == "python3") && (is_final == false) ) {
        console.warn('kernel_name python3 cannot be used, assigning default one')
        return "jupyterlab-requirements"
    }

    return kernel_name
}

/**
 * Function: Delete Python requirements from notebook metadata.
 */

export function delete_key_from_notebook_metadata( notebook: NotebookPanel , key_to_remove: string):  Promise<string> {
    return new Promise( async ( resolve, reject ) => {

        try {
            notebook.model.metadata.delete(key_to_remove)
            return resolve( "Removed correctly " + key_to_remove + " from notebook metadata" )

        } catch ( err ) {
            reject( err )
        }

    })
}


export function get_requirements( notebook: NotebookPanel ):  Promise<Requirements> {
    return new Promise( async ( resolve, reject ) => {
        try {

            if ( notebook.model.metadata.has("requirements") == false ) {
                console.debug("requirements key is not in notebook metadata! Initialize requirements for user...")
                const python_packages: { [ name: string ]: string } = {}

                var python_version: string = get_python_version( notebook )

                if ( python_version == null ) {
                    var python_version: string = await get_discovered_python_version()
                }

                const requires = { python_version: python_version }

                var requirements: Requirements = {
                    packages: python_packages,
                    requires: requires,
                    sources: [
                        new Source()
                    ]
                }
                return resolve( requirements )

            }

            const retrieved = notebook.model.metadata.get("requirements")

            let notebookMetadataRequirements: Requirements = JSON.parse(retrieved.toString())

            if (_.size(notebookMetadataRequirements) == 0) {
                console.debug("requirements key is not in notebook metadata! Initialize requirements for user...")

                const python_packages: { [ name: string ]: string } = {}

                var python_version: string = get_python_version( notebook )

                if ( python_version == null ) {
                    var python_version: string = await get_discovered_python_version()
                }

                const requires = { python_version: python_version }

                var requirements: Requirements = {
                    packages: python_packages,
                    requires: requires,
                    sources: [
                        new Source()
                    ]
                }
                return resolve( requirements )
            }

            else {
                console.debug("requirements key is in notebook metadata!")
                return resolve (notebookMetadataRequirements)
            }

        } catch ( err ) {
            reject( err )
        }
    })
}

/**
 * Function: Set Python requirements into notebook metadata.
 */

export async function set_requirements( notebook: NotebookPanel, requirements: Requirements ): Promise<void> {
    const notebook_metadata = notebook.model.metadata

    if ( notebook_metadata.has("requirements") == false ) {
        notebook_metadata.set('requirements', JSON.stringify(requirements) )
        console.debug( "Notebook requirements have been set successfully." )

    } else {
        console.debug( "Notebook requirements already exist. Updating..." )

        // update the notebook metadata

        // Fail if no packages are present are not in requirements.
        if  ( _.isEmpty(requirements.packages) == true)  {
            console.debug( "Notebook requirements packages is empty..." )
            throw new Error( `Packages in notebook requirements is empty: '${ requirements }' `, )
        }

        notebook_metadata.set('requirements', JSON.stringify(requirements) )
    }
}

/**
 * Function: Get Python requirements lock from notebook metadata.
 */

export function get_requirement_lock( notebook: NotebookPanel ): Promise<RequirementsLock|null> {
    return new Promise( async ( resolve, reject ) => {
        const notebook_metadata = notebook.model.metadata

        try {
            if ( notebook_metadata.has("requirements_lock") == false ) {
                console.debug("requirements_lock key is not in notebook metadata!")
                resolve( null )
            }

            const requirements_lock = notebook_metadata.get("requirements_lock")
            var notebookMetadataRequirementsLock: RequirementsLock = JSON.parse(requirements_lock.toString())

            console.debug("requirements_lock key is in notebook metadata!")
            resolve ( notebookMetadataRequirementsLock )

        } catch ( err ) {
            reject( err )
        }
    })
}

/**
 * Function: Set Python requirements into notebook metadata.
 */

export async function set_requirement_lock( notebook: NotebookPanel, requirements_lock: RequirementsLock ): Promise<void> {
    const notebook_metadata = notebook.model.metadata

    if ( notebook_metadata.has("requirements_lock") == false ) {
        notebook_metadata.set('requirements_lock', JSON.stringify(requirements_lock) )

    } else {
        console.debug( "Notebook requirement_lock already exist. Updating." )
        // update the notebook metadata
        notebook_metadata.set('requirements_lock', JSON.stringify(requirements_lock) )
    }

    console.debug( "Notebook requirements_lock have been set successfully." )
}


/**
 * Function: Get Thoth configuration from notebook metadata.
 */
export function get_thoth_configuration( notebook: NotebookPanel ): Promise<ThothConfig|null> {

    return new Promise( async ( resolve, reject ) => {
        const notebook_metadata = notebook.model.metadata

        try {
            if ( notebook_metadata.has("thoth_config") == false ) {
                console.debug("thoth_config key is not in notebook metadata!")
                resolve( null )
            }

            const thoth_config = notebook_metadata.get("thoth_config")
            var notebookMetadataThothConfig: ThothConfig = JSON.parse(thoth_config.toString())

            console.debug("thoth_config key is in notebook metadata!")
            resolve ( notebookMetadataThothConfig )

        } catch ( err ) {
            reject( err )
        }
    })
    }

/**
 * Function: Set Thoth config file requirements into notebook metadata.
 */

export async function set_thoth_configuration( notebook: NotebookPanel, config_file: ThothConfig ): Promise<void> {
    const metadata = notebook.model.metadata

    if ( metadata.has("thoth_config") == false ) {
        metadata.set('thoth_config', JSON.stringify(config_file) )

    } else {
        console.debug( "Notebook Thoth config already exist. Updating." )
        // update the notebook metadata
        metadata.set('thoth_config', JSON.stringify(config_file) )
    }

    console.debug( "Notebook Thoth config have been set successfully." )
  }

/**
 * Function: Get resolution engine from notebook metadata.
 */
export function get_resolution_engine( notebook: NotebookPanel ): Promise<string|null> {

    return new Promise( ( resolve, reject ) => {
        const notebook_metadata = notebook.model.metadata

        try {
            if ( notebook_metadata.has("dependency_resolution_engine") == false ) {
                console.debug("dependency_resolution_engine key is not in notebook metadata!")
                resolve( null )
            }

            const dependency_resolution_engine = notebook_metadata.get("dependency_resolution_engine")
            var notebookMetadataResolutionEngine: string = dependency_resolution_engine.toString()
            console.debug("dependency_resolution_engine key is in notebook metadata!")
            resolve ( notebookMetadataResolutionEngine )

        } catch ( err ) {
            reject( err )
        }
    })
    }

/**
 * Function: Set resolution engine name used into notebook metadata.
 */

export async function set_resolution_engine( notebook: NotebookPanel, dependency_resolution_engine: string ): Promise<void> {
    const metadata = notebook.model.metadata

    if ( metadata.has("dependency_resolution_engine") == false ) {
        metadata.set('dependency_resolution_engine', dependency_resolution_engine )

    } else {
        console.debug( "Dependency resolution engine used for requirements already exist. Updating." )
        // update the notebook metadata
        metadata.set('dependency_resolution_engine', dependency_resolution_engine )
    }

    console.debug( "Dependency resolution engine used for requirements have been set successfully." )
  }


 /**
 * Function: Take notebook content from cells.
 */

export async function take_notebook_content( notebook: NotebookPanel ): Promise<string> {

    const default_python_indent = 4
    let number_of_cells = notebook.model.cells.length

    var array = _.range(0, number_of_cells);

    // Iterate over cells
    let cells: Array<string> = []

    _.each(array, function (cell_number, key) {
        let cell = notebook.model.cells.get(cell_number)
        if ( (cell.type === "code") && ( !cell.value.text.startsWith( "%%" )) ) {

            const cell_text = cell.value.text
                .trim()
                .replace( /^[%!]{1}[^%]{1}.*$/gm, "\n" )  // remove lines starting with single % or !
                .replace( /^\s*\n/gm, "" )     // remove empty lines

            console.debug("cell n.", cell_number, cell_text);
            cells.push(cell_text)
        }
    });

    let notebook_content: string = cells.join( "\n" )

    notebook_content = utils.indent( notebook_content, default_python_indent * 3 )

    console.debug("notebook content", notebook_content)

    return notebook_content

  }
