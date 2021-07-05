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

import { NotebookPanel } from "@jupyterlab/notebook";

import {
    discover_installed_packages,
    discover_python_version,
    gather_library_usage,
    store_dependencies
} from "./kernel";

import {
    delete_key_from_notebook_metadata,
    get_kernel_name,
    set_requirements,
    set_requirement_lock,
    set_resolution_engine,
    set_thoth_configuration,
    take_notebook_content
} from "./notebook";

import { retrieve_config_file } from "./thoth"
import { Requirements, RequirementsLock } from "./types/requirements";
import { RuntimeEnvironment, ThothConfig } from "./types/thoth"
import { IDependencyManagementUIState } from "./components/dependencyManagementUI"
import { checkInstalledPackages } from "./common";

/**
 * Function: Create Thoth configuration file using thamos library on the backend
 */

export async function  create_config(
    kernel_name: string
): Promise<ThothConfig> {
    return new Promise( async ( resolve, reject ) => {
        try {
            const config_file = await retrieve_config_file( kernel_name );
            console.debug("Config file", config_file);

            resolve( config_file )

        } catch ( err ) {
            reject( err )
        }

    })
}

async function _handle_runtime_environment(
    processed_thoth_config: ThothConfig,
    kernel_name: string,
    recommendation_type: string,
): Promise<ThothConfig> {
    const runtime_environments: RuntimeEnvironment[] = processed_thoth_config.runtime_environments
    const runtime_environment: RuntimeEnvironment = processed_thoth_config.runtime_environments[0]

    _.set(runtime_environment, "name", kernel_name)
    _.set(runtime_environment, "recommendation_type", recommendation_type)
    _.set(runtime_environments, 0, runtime_environment)
    _.set(processed_thoth_config, "runtime_environments", runtime_environments)

    console.debug("processed thoth config", processed_thoth_config)

    return processed_thoth_config
}

export async function  _handle_thoth_config(
    loaded_config_file: ThothConfig,
    default_kernel_name: string,
    default_config_file: ThothConfig,
    default_recommendation_type: string,
    resolution_engine: string
): Promise<{"thoth_config": ThothConfig, "thoth_config_type": string}> {

    return new Promise( async ( resolve, reject ) => {

        if ( resolution_engine == "pipenv" ) {
            resolve({"thoth_config": loaded_config_file, "thoth_config_type": "unused"})
        }

        try {
            // Load thoth_config from notebook metadata, if any, otherwise get default one
            var thoth_config_loaded: ThothConfig = loaded_config_file

            // Define detected config
            var thoth_config_detected: ThothConfig = await create_config( default_kernel_name );

            var is_default_config = false
            // If the endpoint cannot be reached or there are issues with thamos config creation
            if ( _.isUndefined(thoth_config_detected) == true ) {
                var thoth_config_detected: ThothConfig = default_config_file;
                console.warn("Thoth config is undefined, using default config file", default_config_file)
                var is_default_config = true
            }
            // End

            if ( thoth_config_loaded == null ) {
                // No Thoth config found in notebook metadata, create default one
                console.debug("No initial thoth config found in notebook metadata.")
                var thoth_config = thoth_config_detected
                console.debug("No runtime environment loaded from notebook metadata. Using the one detected from source... ")
                var thoth_config_used = "detected"
            }
            else {

                // Loaded config
                var runtime_environment_loaded = thoth_config_loaded.runtime_environments[0]

                var operating_system_name_loaded = runtime_environment_loaded.operating_system.name
                var operating_system_version_loaded = runtime_environment_loaded.operating_system.version
                var python_version_loaded = runtime_environment_loaded.python_version
                // End

                // Detected config
                var runtime_environment_detected: RuntimeEnvironment = thoth_config_detected.runtime_environments[0]

                var operating_system_name_detected = runtime_environment_detected.operating_system.name
                var operating_system_version_detected = runtime_environment_detected.operating_system.version
                var python_version_detected = runtime_environment_detected.python_version

                // End

                console.debug("runtime environment used", runtime_environment_loaded)
                console.debug("runtime environment detected", runtime_environment_detected)

                const checks = []

                if (_.isEqual(operating_system_name_loaded, operating_system_name_detected) ) {
                    console.debug("Operating system name loaded is the same as detected one")
                    checks.push(1)
                }
                else {
                    console.debug( `Operating system name loaded '${ operating_system_name_loaded }' is not the same as detected one '${ operating_system_name_detected }'` )
                    checks.push(0)
                }

                if (_.isEqual(operating_system_version_loaded, operating_system_version_detected) ) {
                    console.debug("Operating system version loaded is the same as detected one")
                    checks.push(1)
                }
                else {
                    console.debug( `Operating system version loaded '${ operating_system_version_loaded }' is not the same as detected one '${ operating_system_version_detected }'` )
                    checks.push(0)
                }

                if (_.isEqual(python_version_loaded, python_version_detected) ) {
                    console.debug("Python version loaded is the same as detected one")
                    checks.push(1)
                }
                else {
                    console.debug( `Python version loaded '${ python_version_loaded }' is not the same as detected one '${ python_version_detected }'` )
                    checks.push(0)
                }

                if ( _.sum(checks) != 3 ) {
                    console.debug("Runtime environment loaded is not the same as detected one")
                    var thoth_config = thoth_config_detected

                    if ( is_default_config == false) {
                        var thoth_config_used = "detected"
                    }

                    else {
                        var thoth_config_used = "default"
                    }
                }
                else {
                    console.debug("Runtime environment loaded is the same as detected one")
                    var thoth_config = thoth_config_loaded
                    var thoth_config_used = "loaded"
                }

            }

            const final_thoth_config = await _handle_runtime_environment(
                thoth_config,
                default_kernel_name,
                default_recommendation_type
            )

            resolve({"thoth_config": final_thoth_config, "thoth_config_type": thoth_config_used})


        } catch ( err ) {
            reject( err )
        }

    })
}

export async function _handle_requirements(
    initial_loaded_requirements: Requirements,
    panel: NotebookPanel,
    thoth_config: ThothConfig,
    ui_state: IDependencyManagementUIState
): Promise<{"state": IDependencyManagementUIState, "is_final_state": boolean }> {

    // Load requirements from notebook metadata, if any, otherwise receive default ones
    var loaded_requirements: Requirements = initial_loaded_requirements
    console.debug("loaded requirements", loaded_requirements)

    var loaded_packages = loaded_requirements.packages
    console.debug("loaded requirements packages", loaded_packages)

    // Check if any package is present in the loaded requirements
    if ( _.size( loaded_packages ) == 0 ) {

        // Check if any package import is present (only when notebook without dependencies in metadata)
        const notebook_content = await take_notebook_content( panel )

        if (_.isEmpty( notebook_content ) == false ) {
            var gathered_libraries: Array<string> = await gather_library_usage( notebook_content );
            console.debug("gathered_libraries", gathered_libraries)

        if ( _.size(gathered_libraries) > 0 ) {

            // Evaluate total package from initial + added
            const identified_packages = {}

            _.forEach(gathered_libraries, function(library) {

              // TODO: Use new user-api endpoint when it will be available.
              if ( library == "sklearn") {
                _.set(identified_packages, "scikit-learn", "*")
              }

              else if ( library == "dotenv" ) {
                _.set(identified_packages, "python-dotenv", "*")
              }

              else if ( library == "IPython" ) {
                _.set(identified_packages, "ipython", "*")
              }

              else if ( library == "gzip" ) {
                _.unset(identified_packages, "gzip")
              }

              else {
                _.set(identified_packages, library, "*")
              }

            })

            console.debug("identified_packages", identified_packages)

            _.set(ui_state, "status", "only_install_from_imports")
            _.set(ui_state, "loaded_packages", identified_packages)

            _.set(loaded_requirements, "packages", identified_packages)
            _.set(ui_state, "requirements", loaded_requirements)
            _.set(ui_state, "thoth_config", thoth_config)

            return {"state": ui_state, "is_final_state": true }
        }
        else {
            _.set(ui_state, "status", "initial")
            _.set(ui_state, "loaded_packages", loaded_packages)
            _.set(ui_state, "requirements", loaded_requirements)
            _.set(ui_state, "thoth_config", thoth_config)

            return {"state": ui_state, "is_final_state": true }
        }

        }
        else {
            _.set(ui_state, "status", "initial")
            _.set(ui_state, "loaded_packages", loaded_packages)
            _.set(ui_state, "requirements", loaded_requirements)
            _.set(ui_state, "thoth_config", thoth_config)

            return {"state": ui_state, "is_final_state": true }
        }
    }

    _.set(ui_state, "loaded_packages", loaded_packages)
    _.set(ui_state, "requirements", loaded_requirements)
    _.set(ui_state, "thoth_config", thoth_config)

    return {"state": ui_state, "is_final_state": false }
}

/**
 * Function: Parse inputs from notebook metadata and decide which state is required.
 */

export async function parse_inputs_from_metadata(
    ui_state: IDependencyManagementUIState,
    panel: NotebookPanel,
    initial_loaded_thoth_config: ThothConfig,
    initial_loaded_requirements: Requirements,
    initial_loaded_requirements_lock: RequirementsLock,
    initial_resolution_engine: string
): Promise<IDependencyManagementUIState> {
    var kernel_name = ui_state.kernel_name

    if ( ui_state.kernel_name == "python3" ) {
        console.warn('kernel_name python3 cannot be used, assigning default one')
        var kernel_name: string = "jupyterlab-requirements"
    }

    const result = await _handle_thoth_config(
        initial_loaded_thoth_config,
        kernel_name,
        ui_state.thoth_config,
        ui_state.recommendation_type,
        initial_resolution_engine
    )

    const output = await _handle_requirements(
        initial_loaded_requirements,
        panel,
        _.get(result, "thoth_config"),
        ui_state
    )

    var ui_on_start_state = await _handle_requirements_lock(
        initial_loaded_requirements_lock,
        panel,
        _.get(output, "state"),
        _.get(output, "is_final_state"),
        _.get(result, "thoth_config_type")
    )

    return ui_on_start_state

}

/**
 * Function: Retrieve installed packages from kernel.
 */

async function retrieveInstalledPackages(kernel_packages: {}, packages: {}): Promise<{}> {

    console.debug("packages installed (pip list)", kernel_packages);
    const installed_packages = {}

    _.forIn(kernel_packages, function(version, name) {
      if (_.has(packages, name.toLowerCase())) {
        if ( _.get(packages, name.toLowerCase()) == version) {
          _.set(installed_packages, name, version)
        }
      }
    })
    console.debug("Installed packages:", installed_packages)

    return installed_packages
  }


export async function _handle_requirements_lock(
    initial_loaded_requirements_lock: RequirementsLock,
    panel: NotebookPanel,
    ui_state: IDependencyManagementUIState,
    is_final_state: boolean,
    thoth_config_selected: string
): Promise<IDependencyManagementUIState> {
    if ( is_final_state == true) {
        return ui_state
    }
    // requirements is present in notebook metadata

    // Load requirements lock from notebook metadata ( if any )
    const initial_requirements_lock: RequirementsLock = initial_loaded_requirements_lock
    console.debug("initial requirements lock", initial_requirements_lock)

    // Check if requirements locked are present
    if ( initial_requirements_lock == null ) {

        _.set(ui_state, "status", "only_install")

        return ui_state
    }

    // requirements and requirements locked are present in notebook metadata
    const initial_locked_packages = {}

    // Retrieve packages locked
    _.forIn(initial_requirements_lock.default, function(value, package_name) {
      _.set(initial_locked_packages, package_name, value.version.replace("==", ""))
    })

    // Retrieve kernel name from metadata
    const kernel_name = get_kernel_name( panel )

    // Check if all packages in requirements are also in requirements locked (both from notebook metadata)
    const check_packages = {}

    _.forIn(ui_state.loaded_packages, function(version, name) {
      if (_.has(initial_locked_packages, name.toLowerCase()) == true ) {
        _.set(check_packages, name, version)
      }
    })

    console.debug("loaded packages from pipfile", ui_state.loaded_packages)
    console.debug("loaded packages from pipfile lock", initial_locked_packages)
    console.debug("packages in pipfile and pipfile lock", check_packages)
    const kernel_packages = await discover_installed_packages( kernel_name )
    console.debug("kernel packages", kernel_packages)

    const installed_packages = await retrieveInstalledPackages(kernel_packages, initial_locked_packages)

    console.debug("packages from kernel and pipfile lock", installed_packages)

    const initial_installed_packages = {}

    _.forIn(ui_state.loaded_packages, function(version, name) {
      if ( _.has(installed_packages, name.toLowerCase()) == true ) {
        _.set(initial_installed_packages, name, version)
      }
    })

    console.debug("packages from kernel and in pipfile lock and in pipfile", initial_installed_packages)

    // Check match for installed packages available in pipfile and pipfile.lock loaded
    if ( _.isEqual(_.size(ui_state.loaded_packages), _.size(check_packages) )) {

        // check if all requirements locked are also installed in the current kernel
        const are_installed: boolean = await checkInstalledPackages(kernel_packages, initial_locked_packages)
        console.debug("are packages installed?", are_installed)
        // if locked requirements are present in the kernel (match packages installed)
        if ( are_installed == true ) {

            switch(thoth_config_selected) {

                case "detected":
                    // and thoth config is detected, user needs to relock because runtime environment is not the same
                    _.set(ui_state, "status", "only_install_kernel_runenv")
                    _.set(ui_state, "installed_packages", ui_state.loaded_packages)
                    _.set(ui_state, "kernel_name", kernel_name)

                    return ui_state

                case "loaded":
                    // and thoth config is loaded, go to stable state
                    _.set(ui_state, "status", "stable")
                    _.set(ui_state, "installed_packages", ui_state.loaded_packages)
                    _.set(ui_state, "kernel_name", kernel_name)
                    return ui_state

                case "unused":
                    // and thoth config is not used because a different resolution engine was selected, go to stable state with no runtime environment
                    _.set(ui_state, "status", "stable_no_runenv")
                    _.set(ui_state, "installed_packages", ui_state.loaded_packages)
                    _.set(ui_state, "kernel_name", kernel_name)
                    return ui_state

            }
        }

        // if locked requirements are not present or not all present in the kernel, go to only_install_kernel state
        else {

            _.set(ui_state, "status", "only_install_kernel")
            _.set(ui_state, "installed_packages", initial_installed_packages)
            _.set(ui_state, "kernel_name", kernel_name)

            return ui_state

        }
    }

    else {
        _.set(ui_state, "status", "only_install_kernel")
        _.set(ui_state, "installed_packages", initial_installed_packages)
        _.set(ui_state, "kernel_name", kernel_name)

        return ui_state
    }
}

/**
 * Function: Store dependencies on disk using API
 */

export async function store_dependencies_on_disk (
    kernel_name: string,
    requirements: Requirements,
    requirements_lock: RequirementsLock,
    path_to_store: string,
    complete_path: string
  ) {
    // TODO: Requested from the user (in this case it is to install them)
    const store_message: string = await store_dependencies(
        kernel_name,
        JSON.stringify(requirements),
        JSON.stringify(requirements_lock),
        path_to_store,
        complete_path
    );

    console.debug("Store message", store_message);
}

/**
 * Function: Set all notebook metadata generated
 */

export async function set_notebook_metadata(
    panel: NotebookPanel,
    resolution_engine: string,
    requirements: Requirements,
    requirements_lock: RequirementsLock,
    thoth_config?: ThothConfig
  ) {

    await set_resolution_engine( panel , resolution_engine )
    await set_requirements( panel , requirements )
    await set_requirement_lock( panel , requirements_lock )

    if (resolution_engine == "thoth" ) {
        await set_thoth_configuration( panel , thoth_config )
    }

    // Save all changes to disk.
    await panel.context.save()
}


export async function _parse_packages_from_state(
    loaded_packages: {},
    added_packages: {}
): Promise<{"new_packages": {}, "total_packages": {}}> {
    // loaded packages from notebook metadata
    console.debug("loaded_packages", loaded_packages)

    // added packages by user
    console.debug("added_packages", added_packages)

    // Evaluate total package from initial_loaded + added
    const total_packages = {}

    _.forIn(loaded_packages, function(value, key) {
      if ( _.has(loaded_packages, "") == false) {
        _.set(total_packages, key, value)
      }
    })

    // filter packages that do not have name
    const new_packages = {}
    _.forIn(added_packages, function(value, key) {
      if ( _.has(added_packages, "") == false) {
        _.set(total_packages, key, value)
        _.set(new_packages, key, value) // == added_packages
      }
    })

    return {"new_packages": new_packages, "total_packages": total_packages}
}

/**
 * Function: Set all notebook metadata generated
 */

export async function remove_notebook_metadata(
    panel: NotebookPanel,
) {
    delete_key_from_notebook_metadata( panel, "requirements" )
    delete_key_from_notebook_metadata( panel, "requirements_lock" )
    delete_key_from_notebook_metadata( panel, "thoth_config" )
    delete_key_from_notebook_metadata( panel, "dependency_resolution_engine" )

    // Save all changes to disk.
    panel.context.save()
}


export async function _handle_deleted_packages_case(
    deleted_packages: {},
    total_packages: {},
    panel: NotebookPanel,
    ui_state: IDependencyManagementUIState,
    new_packages: {}
): Promise<{"action_required": string, "new_state": IDependencyManagementUIState}> {

  // Check if there are any deleted packages
  if ( _.size( deleted_packages ) > 0 ) {

    if (  _.size( total_packages ) > 0 ) {
      // If there are any deleted packages and others relock with resolution engine
      return {"action_required": "relock", "new_state": ui_state}
    }

    else {
      // If there are any deleted packages and no other packages, then free requirements, requirements_lock and thoth.yaml
      await remove_notebook_metadata(
          panel
      )

      var emptyRequirements: Requirements = {
        packages: {},
        requires: ui_state.requirements.requires,
        sources: ui_state.requirements.sources
      }

      _.set(ui_state, "status", "initial" )
      _.set(ui_state, "packages", new_packages )
      _.set(ui_state, "deleted_packages", {} )
      _.set(ui_state, "requirements", emptyRequirements )

      return {"action_required": "go_to_state", "new_state": ui_state}
    }
  }

  return {"action_required": "continue", "new_state": ui_state}
}


export async function _handle_total_packages_case(
    total_packages: {},
    panel: NotebookPanel,
    ui_state: IDependencyManagementUIState
): Promise<IDependencyManagementUIState> {
    // Check if there are packages saved, otherwise go to failed notification message
    if ( _.size( total_packages ) > 0 ) {

        if ( _.isEqual( total_packages , ui_state.installed_packages) ){

          var sameRequirements: Requirements = {
            packages: total_packages ,
            requires: ui_state.requirements.requires,
            sources: ui_state.requirements.sources
          }

          // Set requirements in notebook;
          set_requirements( panel , sameRequirements )

          // Save all changes to disk.
          panel.context.save()

          _.set(ui_state, "status", "stable" )
          _.set(ui_state, "packages", {} )

          return ui_state
        }

        else {

          console.debug("total packages", total_packages )

          var finalRequirements: Requirements = {
            packages: total_packages ,
            requires: ui_state.requirements.requires,
            sources: ui_state.requirements.sources
          }

          console.debug("Requirements before installing are: ", finalRequirements)

          // Set requirements in notebook;
          set_requirements( panel , finalRequirements )

          // Save all changes to disk.
          panel.context.save()

          _.set(ui_state, "status", "saved" )
          _.set(ui_state, "packages", {} )
          _.set(ui_state, "loaded_packages", total_packages )
          _.set(ui_state, "requirements", finalRequirements )

          return ui_state
        }

      }
    else {
        _.set(ui_state, "status", "failed_no_reqs" )
        _.set(ui_state, "packages", total_packages )

        return ui_state
    }
}


/**
 * Function: Discover python version.
 */
 export async function get_discovered_python_version( ): Promise<string> {
    return new Promise( async ( resolve, reject ) => {
        console.info( `Python version is null, discovering it....` )

        try {
            const python_version_discovered: string = await discover_python_version()
            console.info( `Python version discovered is '${ python_version_discovered }'.` )
            resolve(python_version_discovered)

        } catch ( err ) {
            reject( null )
        }

    })
}
