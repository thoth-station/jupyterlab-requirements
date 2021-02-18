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


/**
 * Function: Get Python version from language information.
 */
export function get_python_version( notebook: NotebookPanel ): string {
    const language_info = notebook.content.model.metadata.get( 'language_info' )
    console.log('language_info:', language_info)

    const python_version: string = _.get(language_info, "version")

    console.log('python version identified:', python_version)

    if ( python_version == null ) {
        console.log( `Python version '${ python_version }' is null.` )
        return null  // TODO: Discover automatically Python version present
    }

    const match = python_version.match( /\d.\d/ )
    console.log('match identified:', match)

    if ( match == null ) {
        throw new Error( `Python version '${ python_version }' does not match required pattern.` )
    }

    return match[ 0 ]
}

/**
 * Function: Get kernel name from kernel spec.
 */
export function get_kernel_name( notebook: NotebookPanel ): string {
    const kernelspec = notebook.content.model.metadata.get( 'kernelspec' )
    console.log('kernel info:', kernelspec)

    const kernel_name = _.get(kernelspec, "name")

    console.log('kernel_name identified:', kernel_name)

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
                console.log("requirements key is not in notebook metadata! Initialize requirements for user...")
                const python_packages: { [ name: string ]: string } = {}
                const requires = { python_version: get_python_version( notebook ) }

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
                console.log("requirements key is not in notebook metadata! Initialize requirements for user...")

                const python_packages: { [ name: string ]: string } = {}
                const requires = { python_version: get_python_version( notebook ) }

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
                console.log("requirements key is in notebook metadata!")
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

export function set_requirements( notebook: NotebookPanel, requirements: Requirements ): void {
    const notebook_metadata = notebook.model.metadata

    if ( notebook_metadata.has("requirements") == false ) {
        notebook_metadata.set('requirements', JSON.stringify(requirements) )
        console.log( "Notebook requirements have been set successfully." )

    } else {
        console.log( "Notebook requirements already exist. Updating..." )

        // update the notebook metadata

        // Fail if no packages are present are not in requirements.
        if  ( _.isEmpty(requirements.packages) == true)  {
            console.log( "Notebook requirements packages is empty..." )
            throw new Error( `Packages in notebook requirements is empty: '${ requirements }' `, )
        }

        notebook_metadata.set('requirements', JSON.stringify(requirements) )
        return
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
                console.log("requirements_lock key is not in notebook metadata!")
                resolve( null )
            }

            const requirements_lock = notebook_metadata.get("requirements_lock")
            var notebookMetadataRequirementsLock: RequirementsLock = JSON.parse(requirements_lock.toString())

            console.log("requirements_lock key is in notebook metadata!")
            resolve ( notebookMetadataRequirementsLock )

        } catch ( err ) {
            reject( err )
        }
    })
}

/**
 * Function: Set Python requirements into notebook metadata.
 */

export function set_requirement_lock( notebook: NotebookPanel, requirements_lock: RequirementsLock ): void {
    const notebook_metadata = notebook.model.metadata

    if ( notebook_metadata.has("requirements_lock") == false ) {
        notebook_metadata.set('requirements_lock', JSON.stringify(requirements_lock) )

    } else {
        console.debug( "Notebook requirement_lock already exist. Updating." )
        // update the notebook metadata
        notebook_metadata.set('requirements_lock', JSON.stringify(requirements_lock) )
    }

    console.log( "Notebook requirements_lock have been set successfully." )
}


/**
 * Function: Get Thoth configuration from notebook metadata.
 */
export function get_thoth_configuration( notebook: NotebookPanel ): Promise<ThothConfig|null> {

    return new Promise( async ( resolve, reject ) => {
        const notebook_metadata = notebook.model.metadata

        try {
            if ( notebook_metadata.has("thoth_config") == false ) {
                console.log("thoth_config key is not in notebook metadata!")
                resolve( null )
            }

            const thoth_config = notebook_metadata.get("thoth_config")
            var notebookMetadataThothConfig: ThothConfig = JSON.parse(thoth_config.toString())

            console.log("thoth_config key is in notebook metadata!")
            resolve ( notebookMetadataThothConfig )

        } catch ( err ) {
            reject( err )
        }
    })
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


/**
 * Function: Set resolution engine name used into notebook metadata.
 */

export function set_resolution_engine( notebook: NotebookPanel, dependency_resolution_engine: string ): void {
    const metadata = notebook.model.metadata

    if ( metadata.has("dependency_resolution_engine") == false ) {
        metadata.set('dependency_resolution_engine', dependency_resolution_engine )

    } else {
        console.debug( "Dependency resolution engine used for requirements already exist. Updating." )
        // update the notebook metadata
        metadata.set('dependency_resolution_engine', dependency_resolution_engine )
    }

    console.log( "Dependency resolution engine used for requirements have been set successfully." )
  }
