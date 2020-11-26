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
// import { KernelSpec } from '@jupyterlab/services';

import { Source, Requirements, RequirementLock, PythonPackage } from './types/requirements';
import { ThothConfig } from "./types/thoth";


/**
 * Function: Get Kernel info.
 */
export function get_kernel_spec( notebook: NotebookPanel ): string {
    const json: string = JSON.stringify( notebook.sessionContext.session.kernel.info )  // TODO: Take kernel info for Python version (kernelspec -> Language info -> version)
    if ( _.isUndefined( json ) ) {
        throw Error( "Unable to retrieve Kernel info" )
    }

    return json
}

/**
 * Function: Get Python version from kernel spec.
 */
export function get_python_version( notebook: NotebookPanel ): string {
    const kernel_info = get_kernel_spec( notebook )
    console.log('kernel info:', kernel_info)
    const python_version: string = "3.8" || kernel_info // TODO: Parse kernel info 

    console.log('python version identified:', python_version)
    const match = python_version.match( /\d.\d/ )
    console.log('match identified:', match)

    if ( match == null ) {
        throw new Error( `Python version '${ python_version }' does not match required pattern.` )
    }

    return match[ 0 ]
}

/**
 * Function: Get Python requirements from notebook metadata.
 */
export function get_requirements( notebook: NotebookPanel ):  Promise<Requirements | null> {
    return new Promise( async ( resolve, reject ) => {
        console.log( "Reading notebook requirements." )

        let notebookMetadataRequirements: Requirements | {} = notebook.model.metadata.get("requirements") || {}

        const aliases = _.get( notebookMetadataRequirements, "aliases" ) || {}
        const python_packages: Array<PythonPackage> = []
        const requires = { python_version: get_python_version( notebook ) }

        if (notebookMetadataRequirements == null) {
            console.log("requirements key is not in notebook metadata!")
            const notebookMetadataRequirements: Requirements = {
                aliases: aliases,
                packages: python_packages,
                requires: requires,
                sources: [
                    new Source()
                ]
            }
            resolve( notebookMetadataRequirements )
        }

        try {
            resolve( notebookMetadataRequirements as Requirements )

        } catch ( err ) {
            reject( err )
        }
    })
}

/**
 * Function: Set Python requirements into notebook metadata.
 */

export function set_requirements( notebook: NotebookPanel, requirements: Requirements ): void {
    const metadata = notebook.model.metadata

    if ( metadata.has("requirements") == false ) {
        metadata.set('requirements', JSON.stringify(requirements) )

    } else {
        console.debug( "Notebook requirements already exist. Updating." )
        // update the notebook metadata
        metadata.set('requirements', JSON.stringify(requirements) )
    }

    console.log( "Notebook requirements have been set successfully." )
}

/**
 * Function: Get Python requirements lock from notebook metadata.
 */

// TODO: Adjust method to receive Promise<Requirements | null>
export function get_requirement_lock( notebook: NotebookPanel ): Object | null {

    let notebookMetadataRequirementsLock = notebook.model.metadata.get("requirement_lock")

    if (notebookMetadataRequirementsLock == null) {
        console.log("requirement_lock key is not in notebook metadata!")
        return null
    }

    return notebookMetadataRequirementsLock
}

/**
 * Function: Set Python requirements into notebook metadata.
 */

export function set_requirement_lock( notebook: NotebookPanel, requirements_lock: RequirementLock ): void {
    const metadata = notebook.model.metadata

    if ( metadata.has("requirement_lock") == false ) {
        metadata.set('requirement_lock', JSON.stringify(requirements_lock) )

    } else {
        console.debug( "Notebook requirement_lock already exist. Updating." )
        // update the notebook metadata
        metadata.set('requirement_lock', JSON.stringify(requirements_lock) )
    }

    console.log( "Notebook requirement_lock have been set successfully." )
}


/**
 * Function: Get Thoth configuration from notebook metadata.
 */
export function get_thoth_configuration( notebook: NotebookPanel ): Object | null {

    let notebookMetadataThothConfig = notebook.model.metadata.get("thoth_config")

    if (notebookMetadataThothConfig == null) {
        console.log("thoth_config key is not in notebook metadata!")
        return null
    }

    return notebookMetadataThothConfig
}

/**
 * Function: Set Thoth config file requirements into notebook metadata.
 */

export function set_thoth_configuration( notebook: NotebookPanel, config_file: ThothConfig ): void {
    const metadata = notebook.model.metadata
  
    if ( metadata.has("thoth_config") == false ) {
        metadata.set('thoth_config', JSON.stringify(config_file) )
  
    } else {
        console.debug( "Notebook Thoth config already exist. Updating." )
        // update the notebook metadata
        metadata.set('thoth_config', JSON.stringify(config_file) )
    }
  
    console.log( "Notebook Thoth config have been set successfully." )
  }