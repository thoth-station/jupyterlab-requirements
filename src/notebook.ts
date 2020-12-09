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
 * Function: Get Python requirements from notebook metadata.
 */
export function get_requirements( notebook: NotebookPanel ):  Promise<Requirements> {
    return new Promise( async ( resolve, reject ) => {

        try {
            const retrieved = notebook.model.metadata.get("requirements")

            if (typeof retrieved == "undefined") {
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
    const metadata = notebook.model.metadata

    if ( metadata.has("requirements") == false ) {
        metadata.set('requirements', JSON.stringify(requirements) )
        console.log( "Notebook requirements have been set successfully." )

    } else {
        console.log( "Notebook requirements already exist. Updating..." )

        // update the notebook metadata

        console.log()
        // Insert empty requirements if no packages are present.
        if  (typeof requirements.packages === 'undefined')  {
            metadata.set('requirements', {} )
            return
        }

        metadata.set('requirements', JSON.stringify(requirements) )
        return
    }
}

/**
 * Function: Get Python requirements lock from notebook metadata.
 */

export function get_requirement_lock( notebook: NotebookPanel ): Promise<RequirementsLock|null> {
    return new Promise( async ( resolve, reject ) => {

        try {
            const retrieved = notebook.model.metadata.get("requirements_lock")

            if (typeof retrieved == "undefined") {
                console.log("requirement_lock key is not in notebook metadata!")
                resolve( null )
            }

            var notebookMetadataRequirementsLock: RequirementsLock = JSON.parse(retrieved.toString())

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
    const metadata = notebook.model.metadata

    if ( metadata.has("requirements_lock") == false ) {
        metadata.set('requirements_lock', JSON.stringify(requirements_lock) )

    } else {
        console.debug( "Notebook requirement_lock already exist. Updating." )
        // update the notebook metadata
        metadata.set('requirements_lock', JSON.stringify(requirements_lock) )
    }

    console.log( "Notebook requirements_lock have been set successfully." )
}


/**
 * Function: Get Thoth configuration from notebook metadata.
 */
export function get_thoth_configuration( notebook: NotebookPanel ): ThothConfig | null {

    let retrieved = notebook.model.metadata.get("thoth_config")

    if (retrieved == null) {
        console.log("thoth_config key is not in notebook metadata!")
        return null
    }

    return  JSON.parse(JSON.stringify(retrieved))
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
