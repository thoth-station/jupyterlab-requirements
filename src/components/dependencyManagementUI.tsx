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

import * as React from 'react';

import { NotebookPanel } from '@jupyterlab/notebook';

import { DependencyManagementForm } from './dependencyManagementForm'
import { DependencyManagementSaveButton } from './dependencyManagementSaveButton'
import { DependencyManagementInstallButton } from './dependencyManagementInstallButton'
import { DependencyManagementNewPackageButton } from './dependencyManagementAddPackageButton';

import { get_python_version } from "../notebook";
import { Requirements, RequirementsLock } from '../types/requirements';

import { RuntimeEnvironment, ThothConfig } from '../types/thoth';

import {
  discover_installed_packages,
  store_dependencies,
  install_packages,
  create_new_kernel
} from '../kernel';

import {
  retrieve_config_file,
  update_thoth_config_on_disk,
  lock_requirements_with_thoth,
  lock_requirements_with_pipenv
} from '../thoth';

import {
  get_kernel_name,
  set_requirements,
  set_requirement_lock,
  set_resolution_engine,
  set_thoth_configuration,
  delete_key_from_notebook_metadata
} from "../notebook"

import { Advise } from "../types/thoth";

/**
 * The class name added to the new package button (CSS).
 */
const OK_BUTTON_CLASS = "thoth-ok-button";
const THOTH_KERNEL_NAME_INPUT = "thoth-kernel-name-input";
const CONTAINER_BUTTON = "thoth-container-button";
const CONTAINER_BUTTON_CENTRE = "thoth-container-button-centre";

/**
 * Class: Holds properties for DependenciesManagementDialog.
 */

interface IProps {
  panel: NotebookPanel,
  loaded_requirements: Requirements,
  initial_requirements_lock: RequirementsLock,
  initial_config_file: ThothConfig
}

/**
 * Class: Holds state for DependenciesManagementDialog.
 */

export interface IState {
  kernel_name: string
  recommendation_type: string
  status: string,
  packages: { [ name: string ]: string },
  installed_packages: { [ name: string ]: string },
  loaded_packages: { [ name: string ]: string },
  deleted_packages: { [ name: string ]: string },
  requirements: Requirements,
  thoth_config: ThothConfig,
  error_msg: string
}

/**
 * A React Component for handling dependency management.
 */

export class DependenciesManagementUI extends React.Component<IProps, IState> {
    constructor(props: IProps) {
      super(props);

      this.onStart = this.onStart.bind(this),
      this.changeUIstate = this.changeUIstate.bind(this),
      this.addNewRow = this.addNewRow.bind(this),
      this.editRow = this.editRow.bind(this),
      this.editSavedRow = this.editSavedRow.bind(this),
      this.storeRow = this.storeRow.bind(this),
      this.deleteRow = this.deleteRow.bind(this),
      this.deleteSavedRow = this.deleteSavedRow.bind(this),
      this.onSave = this.onSave.bind(this),
      this.checkInstalledPackages = this.checkInstalledPackages.bind(this),
      this.lock_using_thoth = this.lock_using_thoth.bind(this),
      this.lock_using_pipenv = this.lock_using_pipenv.bind(this),
      this.install = this.install.bind(this),
      this.setKernel = this.setKernel.bind(this),
      this.createConfig = this.createConfig.bind(this),
      this.setKernelName = this.setKernelName.bind(this)
      this.setRecommendationType = this.setRecommendationType.bind(this)

      this.state = {
        kernel_name: get_kernel_name( this.props.panel ),
        recommendation_type: "latest",
        status: "loading",
        packages: {},  // editing
        loaded_packages: {},
        installed_packages: {},
        deleted_packages: {},
        requirements: {
          packages: {},
          requires: { python_version: get_python_version( this.props.panel ) },
          sources: [{
            name: "pypi",
            url: "https://pypi.org/simple",
            verify_ssl: true,
          }]
        },
        thoth_config: {
          host: "khemenu.thoth-station.ninja",
          tls_verify: false,
          requirements_format: "pipenv",
          runtime_environments: [{
            name: "ubi:8",
            operating_system: {
              name: "ubi",
              version: "8",
            },
            python_version: "3.8",
            recommendation_type: "latest"
        }]
        },
        error_msg: undefined
      }
    }

    /**
     * Function: Main function to change state and status!
     */

    changeUIstate(
      status: string,
      packages: { [ name: string ]: string },
      loaded_packages: { [ name: string ]: string },
      installed_packages: { [ name: string ]: string },
      deleted_packages: { [ name: string ]: string },
      requirements: Requirements,
      kernel_name: string,
      thoth_config: ThothConfig,
      error_msg?: string,
    ) {

      var new_state: IState = this.state
      console.log("initial", new_state)

      _.set(new_state, "status", status)

      _.set(new_state, "packages", packages)

      _.set(new_state, "loaded_packages", loaded_packages)

      _.set(new_state, "installed_packages", installed_packages)

      _.set(new_state, "deleted_packages", deleted_packages)

      _.set(new_state, "requirements", requirements)

      _.set(new_state, "kernel_name", kernel_name)

      _.set(new_state, "thoth_config", thoth_config)

      _.set(new_state, "error_msg", error_msg)

      console.log("new", new_state)
      this.setState(new_state);
    }

    /**
     * Function: Set recommendation type for thamos advise
     */

    setRecommendationType(recommendation_type: string) {

      this.setState(
        {
          recommendation_type: recommendation_type
        }
      );

    }

    changeRecommendationType(event: React .ChangeEvent<HTMLInputElement>) {

        const recommendation_type = event.target.value;
        this.setRecommendationType( recommendation_type )
  }

    /**
     * Function: Set Kernel name to be created and assigned to notebook
     */

    setKernelName(event: React.ChangeEvent<HTMLInputElement>) {

      const kernel_name = event.target.value

      this.setState(
        {
          kernel_name: kernel_name
        }
      );

    }

    /**
     * Function: Add new empty row (Only one can be added at the time)
     */

    addNewRow() {

      const packages = this.state.packages

      _.set(packages, "", "")
      console.log("added package", packages)

      this.changeUIstate(
        "editing",
        packages,
        this.state.loaded_packages,
        this.state.installed_packages,
        this.state.deleted_packages,
        this.state.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )
    }

    /**
     * Function: Edit added row
     */

    editRow(package_name: string) {

      const packages = this.state.packages

      _.unset(packages, package_name)
      _.set(packages, "", "*")

      console.log("After editing (current)", packages)

      this.changeUIstate(
        "editing",
        packages,
        this.state.loaded_packages,
        this.state.installed_packages,
        this.state.deleted_packages,
        this.state.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )

    }

    /**
     * Function: Edit saved row
     */

    editSavedRow(package_name: string, package_version: string) {

      const loaded_packages = this.state.loaded_packages
      const packages = this.state.packages

      _.unset(loaded_packages, package_name)
      _.set(packages, package_name, package_version)

      console.log("After editing (initial)", loaded_packages)
      console.log("After editing (current)", packages)

      this.changeUIstate(
        "editing",
        packages,
        loaded_packages,
        this.state.installed_packages,
        this.state.deleted_packages,
        this.state.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )

    }

    /**
     * Function: Delete row not saved
     */

    deleteRow(package_name: string) {

      const packages = this.state.packages

      const deleted_packages = {}

      _.unset(packages, package_name)

      console.log("After deleting", packages)

      // TODO: Set correctly the version deleted
      _.set(deleted_packages, package_name, "*")

      console.log("Deleted", deleted_packages)

      this.changeUIstate(
        "editing",
        packages,
        this.state.loaded_packages,
        this.state.installed_packages,
        deleted_packages,
        this.state.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )

    }

    /**
     * Function: Delete row saved
     */

    deleteSavedRow(package_name: string) {

      const saved_packages = this.state.loaded_packages

      _.unset(saved_packages, package_name)

      console.log("After deleting saved", saved_packages)

      const deleted_packages = {}

      // TODO: Set correctly the version deleted
      _.set(deleted_packages, package_name, "*")

      console.log("Deleted", deleted_packages)

      this.changeUIstate(
        "editing",
        this.state.packages,
        saved_packages,
        this.state.installed_packages,
        deleted_packages,
        this.state.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )
    }

    /**
     * Function: Store row when user requests it
     */

    storeRow(package_name: string, package_version: string) {

      let packages = this.state.packages

      _.set(packages, package_name, package_version)
      const new_dict: { [ name: string ]: string } = {}

      _.forIn(packages, function(value, key) {
        console.log(key + ' goes ' + value);

        if ( key != "" ) {
          _.set(new_dict, key, value)
        }
      })

      console.log("new packages", new_dict)

      this.changeUIstate(
        "editing",
        new_dict,
        this.state.loaded_packages,
        this.state.installed_packages,
        this.state.deleted_packages,
        this.state.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )

    }

    /**
     * Function: Save button to store every input in notebook
     */

    onSave() {

      const deleted_packages = this.state.deleted_packages

      const notebookMetadataRequirements = this.state.requirements
      const added_packages = this.state.packages
      console.log("added_packages", added_packages)
      const loaded_packages = this.state.loaded_packages
      console.log("loaded_packages", loaded_packages)

      // Evaluate total package from initial + added
      const total_packages = {}

      _.forIn(loaded_packages, function(value, key) {
        if (_.has(loaded_packages, "") == false) {
          _.set(total_packages, key, value)
        }
      })

      const new_packages = {}
      _.forIn(added_packages, function(value, key) {
        if (_.has(added_packages, "") == false) {
          _.set(total_packages, key, value)
          _.set(new_packages, key, value)
        }
      })

      // Check if there are any deleted packages
      if ( _.size( deleted_packages ) > 0 ) {

        if (  _.size(total_packages ) > 0 ) {
          // If there are any deleted packages and others relock with resolution engine

          this.lock_using_thoth()
          return
        }

        else {
          // If there are any deleted packages and no other packages, then free requirements, requirements_lock and thoth.yaml
          delete_key_from_notebook_metadata( this.props.panel, "requirements" )
          delete_key_from_notebook_metadata( this.props.panel, "requirements_lock" )
          delete_key_from_notebook_metadata( this.props.panel, "thoth_config" )
          delete_key_from_notebook_metadata( this.props.panel, "dependency_resolution_engine" )

          // Save all changes to disk.
          this.props.panel.context.save()

          var emptyRequirements: Requirements = {
            packages: total_packages,
            requires: notebookMetadataRequirements.requires,
            sources: notebookMetadataRequirements.sources
          }

          this.changeUIstate(
            "initial",
            new_packages,
            this.state.loaded_packages,
            this.state.installed_packages,
            {},
            emptyRequirements,
            this.state.kernel_name,
            this.state.thoth_config
          )
        }

      }

      // Check if there are packages saved, otherwise go to failed notification message
      if ( _.size( total_packages ) > 0 ) {

        if ( _.isEqual( total_packages, this.state.installed_packages) ){

          var sameRequirements: Requirements = {
            packages: total_packages,
            requires: notebookMetadataRequirements.requires,
            sources: notebookMetadataRequirements.sources
          }

          // Set requirements in notebook;
          set_requirements( this.props.panel , sameRequirements )

          // Save all changes to disk.
          this.props.panel.context.save()

          this.changeUIstate(
            "stable",
            {},
            this.state.loaded_packages,
            this.state.installed_packages,
            this.state.deleted_packages,
            this.state.requirements,
            this.state.kernel_name,
            this.state.thoth_config
          )
          return
        }

        else {

          console.log("total packages", total_packages)

          var finalRequirements: Requirements = {
            packages: total_packages,
            requires: notebookMetadataRequirements.requires,
            sources: notebookMetadataRequirements.sources
          }

          console.log("Requirements before installing are: ", finalRequirements)

          // Set requirements in notebook;
          set_requirements( this.props.panel , finalRequirements )

          // Save all changes to disk.
          this.props.panel.context.save()

          this.changeUIstate(
            "saved",
            {},
            total_packages,
            this.state.installed_packages,
            this.state.deleted_packages,
            finalRequirements,
            this.state.kernel_name,
            this.state.thoth_config
          )

          return
        }

      }
      else {

        this.changeUIstate(
          "failed_no_reqs",
          new_packages,
          this.state.loaded_packages,
          this.state.installed_packages,
          this.state.deleted_packages,
          this.state.requirements,
          this.state.kernel_name,
          this.state.thoth_config
        )
        return
      }
    }

    async install() {

      try {
          // Create new virtual environment and install dependencies using selected dependency manager (micropipenv by default)
          const install_message = await install_packages( this.state.kernel_name );
          console.log("Install message", install_message);

          this.changeUIstate(
            "setting_kernel",
            {},
            this.state.loaded_packages,
            this.state.loaded_packages,
            this.state.deleted_packages,
            this.state.requirements,
            this.state.kernel_name,
            this.state.thoth_config
          )

          return

      } catch ( error ) {

        console.log("Error installing requirements", error)

        this.changeUIstate(
          "failed",
          this.state.packages,
          this.state.loaded_packages,
          this.state.installed_packages,
          this.state.deleted_packages,
          this.state.requirements,
          this.state.kernel_name,
          this.state.thoth_config,
          "Error install dependencies in the new virtual environment, please contact Thoth team."
        )
      }

    }

    async store_dependencies_on_disk (
        requirements: Requirements,
        requirements_lock: RequirementsLock,
        path_to_store: string,
        using_home_path_base: boolean
      ) {
        // TODO: Requested from the user (in this case it is to install them)
        const store_message: string = await store_dependencies(
          this.state.kernel_name,
          JSON.stringify(requirements),
          JSON.stringify(requirements_lock),
          path_to_store,
          using_home_path_base
        );

        console.log("Store message", store_message);
    }

    async setKernel() {

      try {
          // Add new virtualenv to jupyter kernel so that it can be assigned to notebook.
          const message = await create_new_kernel( this.state.kernel_name );
          console.log("Kernel message", message);

          this.changeUIstate(
            "ready",
            {},
            this.state.loaded_packages,
            this.state.loaded_packages,
            this.state.deleted_packages,
            this.state.requirements,
            this.state.kernel_name,
            this.state.thoth_config
          )

          return

        } catch ( error ) {

          console.log("Error creating jupyter kernel", error)

          this.changeUIstate(
            "failed",
            this.state.packages,
            this.state.loaded_packages,
            this.state.installed_packages,
            this.state.deleted_packages,
            this.state.requirements,
            this.state.kernel_name,
            this.state.thoth_config,
            "Error setting new environment in a jupyter kernel, please contact Thoth team."
          )

          return

        }
    }

    async lock_using_thoth() {

      this.changeUIstate(
        "locking_requirements",
        this.state.packages,
        this.state.loaded_packages,
        this.state.installed_packages,
        this.state.deleted_packages,
        this.state.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )

      const thothConfig: ThothConfig = this.state.thoth_config;
      console.log("thoth config to be submitted", JSON.stringify(thothConfig));

      const notebookMetadataRequirements: Requirements = this.state.requirements;
      console.log("Requirements to be submitted", JSON.stringify(notebookMetadataRequirements));

      try {

        var advise: Advise = await lock_requirements_with_thoth(
          this.state.kernel_name,
          JSON.stringify(thothConfig),
          JSON.stringify(notebookMetadataRequirements)
        );
        console.log("Advise received", advise);

        if ( advise.error == false ) {
          if ( _.isEmpty( advise.requirements.packages ) == false) {

             // Set requirements, requirements lock and thoth config in notebook;
            set_requirements( this.props.panel , advise.requirements )
            set_requirement_lock( this.props.panel , advise.requirement_lock )
            set_thoth_configuration( this.props.panel , thothConfig )
            set_resolution_engine( this.props.panel , "thoth" )

            // Save all changes to disk.
            this.props.panel.context.save()

          } else {

            console.log("Advise requirements packages received is empty, falling back to pipenv", advise.requirements);

            this.lock_using_pipenv()
            }

        } else {
          console.log("Thoth could not solve your stack, falling back to pipenv...")
          this.lock_using_pipenv()
        }

      } catch ( error ) {

        console.log("Error locking requirements with Thoth", error)
        this.lock_using_pipenv()
      }

      if ( advise.error == false ) {
        try {
          await this.store_dependencies_on_disk(
            advise.requirements,
            advise.requirement_lock,
            'overlays',
            false
          )
        } catch ( error ) {

          console.log("Error storing dependencies in overlays", error)

        }

        try {
          await update_thoth_config_on_disk(
            this.state.thoth_config.runtime_environments[0],
            true
            )
          } catch ( error ) {
          console.log("Error updating thoth config on disk", error)
        }
      }

      this.changeUIstate(
        "installing_requirements",
        {},
        this.state.loaded_packages,
        this.state.installed_packages,
        {},
        advise.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )

      return

    }

    async lock_using_pipenv () {

      this.changeUIstate(
        "locking_requirements_using_pipenv",
        this.state.packages,
        this.state.loaded_packages,
        this.state.installed_packages,
        this.state.deleted_packages,
        this.state.requirements,
        this.state.kernel_name,
        this.state.thoth_config
      )

      const notebookMetadataRequirements = this.state.requirements;
      console.log("Requirements for pipenv", JSON.stringify(notebookMetadataRequirements));

      try {

        // TODO: Add check to avoid relocking if dependencies are already locked.
        var result = await lock_requirements_with_pipenv(
          this.state.kernel_name,
          JSON.stringify(notebookMetadataRequirements)
        )
        console.log("Result received", result);

        if ( result.error == false ) {

          set_requirements( this.props.panel , notebookMetadataRequirements )
          set_requirement_lock( this.props.panel , result.requirements_lock )
          set_resolution_engine( this.props.panel , "pipenv" )

          // Save all changes to disk.
          this.props.panel.context.save()

        }

        else {

          this.changeUIstate(
            "failed",
            this.state.packages,
            this.state.loaded_packages,
            this.state.installed_packages,
            this.state.deleted_packages,
            this.state.requirements,
            this.state.kernel_name,
            this.state.thoth_config,
            "No resolution engine was able to install dependendices, please contact Thoth team."
          )

          return
        }

      } catch ( error ) {

        console.log("Error locking requirements with pipenv", error)

        this.changeUIstate(
          "failed",
          this.state.packages,
          this.state.loaded_packages,
          this.state.installed_packages,
          this.state.deleted_packages,
          this.state.requirements,
          this.state.kernel_name,
          this.state.thoth_config,
          "No resolution engine was able to install dependendices, please contact Thoth team."
        )
        return
      }

      if ( result.error == false ) {

        try {
          await this.store_dependencies_on_disk(
            notebookMetadataRequirements,
            result.requirements_lock,
            'overlays',
            false
          )

        } catch ( error ) {

          console.log("Error storing dependencies in overlays", error)

        }

        try {
          await update_thoth_config_on_disk(
            this.state.thoth_config.runtime_environments[0],
            true
          )
        } catch ( error ) {
          console.log("Error updating thoth config on disk", error)
        }
      }


      this.changeUIstate(
        "installing_requirements",
        {},
        this.state.loaded_packages,
        this.state.installed_packages,
        {},
        notebookMetadataRequirements,
        this.state.kernel_name,
        this.state.thoth_config
      )

      return

    }

    async onStart() {

        // Load thoth_config from notebook metadata, if any, otherwise get default one
        var thoth_config_loaded: ThothConfig = this.props.initial_config_file
        var thoth_config_used: string = "loaded"

        if ( thoth_config_loaded == null ) {
          // No Thoth config found in notebook metadata, create default one
          console.log("No initial thoth config found")
        }
        else {
          var runtime_environment_loaded = thoth_config_loaded.runtime_environments[0]

          var operating_system_name_loaded = runtime_environment_loaded.operating_system.name
          var operating_system_version_loaded = runtime_environment_loaded.operating_system.version
          var python_version_loaded = runtime_environment_loaded.python_version
        }

        var thoth_config_detected: ThothConfig = await this.createConfig();
        // If the endpoint cannot be reached or there are issues with thamos config creation
        if (_.isUndefined(thoth_config_detected)) {
          console.warn("Thoth config is undefined")
          var thoth_config_detected: ThothConfig = this.state.thoth_config;
        }

        if ( thoth_config_loaded != null ) {
          var runtime_environment_detected: RuntimeEnvironment = thoth_config_detected.runtime_environments[0]

          var operating_system_name_detected = runtime_environment_detected.operating_system.name
          var operating_system_version_detected = runtime_environment_detected.operating_system.version
          var python_version_detected = runtime_environment_detected.python_version

          console.log("runtime environment used", runtime_environment_loaded)
          console.log("runtime environment detected", runtime_environment_detected)

          const checks = []
          if (_.isEqual(operating_system_name_loaded, operating_system_name_detected) ) {
              console.log("Operating system name loaded is the same as detected one")
              checks.push(1)
          }
          else {
            console.log( `Operating system name loaded '${ operating_system_name_loaded }' is not the same as detected one '${ operating_system_name_detected }'` )
            checks.push(0)
          }

          if (_.isEqual(operating_system_version_loaded, operating_system_version_detected) ) {
            console.log("Operating system version loaded is the same as detected one")
            checks.push(1)
          }
          else {
            console.log( `Operating system version loaded '${ operating_system_version_loaded }' is not the same as detected one '${ operating_system_version_detected }'` )
            checks.push(0)
          }

          if (_.isEqual(python_version_loaded, python_version_detected) ) {
            console.log("Python version loaded is the same as detected one")
            checks.push(1)
          }
          else {
            console.log( `Python version loaded '${ python_version_loaded }' is not the same as detected one '${ python_version_detected }'` )
            checks.push(0)
          }

          if ( _.sum(checks) != 3 ) {
            console.log("Runtime environment loaded is not the same as detected one")
            var thoth_config = thoth_config_detected
            var thoth_config_used = "detected"
          }

          else {
            console.log("Runtime environment loaded is not the same as detected one")
            var thoth_config = thoth_config_loaded
            var thoth_config_used = "loaded"
          }

        }
        else {
          var thoth_config = thoth_config_detected
          console.log("No runtime environment loaded from notebook metadata. Detecting from source... ")
          var thoth_config_used = "detected"
        }

        const runtime_environments: RuntimeEnvironment[] = thoth_config.runtime_environments
        const runtime_environment: RuntimeEnvironment = thoth_config.runtime_environments[0]

        // TODO: Assign user recommendation type to all runtime environments in thoth config?
        _.set(runtime_environment, "name", this.state.kernel_name)
        _.set(runtime_environment, "recommendation_type", this.state.recommendation_type)
        _.set(runtime_environments, 0, runtime_environment)
        _.set(thoth_config, "runtime_environments", runtime_environments)

        console.log("initial thoth config", thoth_config)

        // Load requirements from notebook metadata, if any, otherwise receive default ones
        var loaded_requirements: Requirements = this.props.loaded_requirements
        console.log("loaded requirements", loaded_requirements)
        var loaded_packages = loaded_requirements.packages
        console.log("loaded requirements packages", loaded_packages)

        // Check if any package is present in the loaded requirements otherwise go to initial state
        if ( _.size( loaded_packages ) == 0 ) {
          this.changeUIstate(
            status="initial" ,
            this.state.packages,
            loaded_packages,
            this.state.installed_packages,
            this.state.deleted_packages,
            loaded_requirements,
            this.state.kernel_name,
            thoth_config
          )
          return
        }

        // requirements is present in notebook metadata

        // Load requirements lock from notebook metadata ( if any )
        const initial_requirements_lock: RequirementsLock = this.props.initial_requirements_lock
        console.log("initial requirements lock", initial_requirements_lock)

        // Check if requirements locked are present
        if ( initial_requirements_lock == null ) {
          this.changeUIstate(
            status="only_install" ,
            this.state.packages,
            loaded_packages,
            this.state.installed_packages,
            this.state.deleted_packages,
            loaded_requirements,
            this.state.kernel_name,
            thoth_config
          )
          return
        }

        // requirements and requirements locked are present in notebook metadata
        const initial_locked_packages = {}

        // Retrieve packages locked
        _.forIn(initial_requirements_lock.default, function(value, package_name) {
          _.set(initial_locked_packages, package_name, value.version.replace("==", ""))
        })
        console.log(initial_locked_packages)

        // Retrieve kernel name from metadata
        const kernel_name = get_kernel_name( this.props.panel )

        // Check if all packages in requirements are also in requirements locked (both from notebook metadata)
        const check_packages = {}

        _.forIn(loaded_packages, function(version, name) {
          if (_.has(initial_locked_packages, name.toLowerCase()) == true ) {
            _.set(check_packages, name, version)
          }
        })

        console.log("initial packages", loaded_packages)
        console.log("packages in req and req lock", check_packages)

        const installed_packages = await this.retrieveInstalledPackages(kernel_name, initial_locked_packages)

        const initial_installed_packages = {}

        _.forIn(loaded_packages, function(version, name) {
          if (_.has(installed_packages, name.toLowerCase()) == true ) {
            _.set(initial_installed_packages, name, version)
          }
        })

        console.log("initial installed packages", initial_installed_packages)

        // TODO: Create endpoints to rely on thoth-python/thamos libraries for any operation between dependency managements files
        if (_.isEqual(_.size(loaded_packages), _.size(check_packages) )) {

          // check if all requirements locked are also installed in the current kernel
          const are_installed: boolean = await this.checkInstalledPackages(installed_packages, initial_locked_packages)

          // if locked requirements are present in the kernel (match packages installed)
          if ( are_installed == true ) {

            // and thoth config is loaded, go to stable state
            if ( thoth_config_used == "loaded" ) {

              this.changeUIstate(
                "stable",
                this.state.packages,
                loaded_packages,
                loaded_packages,
                this.state.deleted_packages,
                loaded_requirements,
                kernel_name,
                thoth_config
                )

              return
            }

            // and thoth config loaded is null, go to stable state, nothing to be done
            if ( thoth_config_loaded == null ) {

              this.changeUIstate(
                "stable",
                this.state.packages,
                loaded_packages,
                loaded_packages,
                this.state.deleted_packages,
                loaded_requirements,
                kernel_name,
                thoth_config
                )

              return
            }

            // and thoth config is detected, user needs to relock because runtime environment is not the same
            if ( thoth_config_used == "detected" ) {
              this.changeUIstate(
                "only_install_kernel_re",
                this.state.packages,
                loaded_packages,
                loaded_packages,
                this.state.deleted_packages,
                loaded_requirements,
                kernel_name,
                thoth_config
                )

              return
            }

            }

          // if locked requirements are not present or not all present in the kernel, go to only_install_kernel state
          else {
            this.changeUIstate(
              "only_install_kernel",
              this.state.packages,
              loaded_packages,
              initial_installed_packages,
              this.state.deleted_packages,
              loaded_requirements,
              kernel_name,
              thoth_config
              )
            return
          }
        }

        else {
          this.changeUIstate(
            "only_install_kernel",
            this.state.packages,
            loaded_packages,
            initial_installed_packages,
            this.state.deleted_packages,
            loaded_requirements,
            kernel_name,
            thoth_config
            )
          return
        }
    }


    async retrieveInstalledPackages(kernel_name:string, packages: {}): Promise<{}> {

      // Retrieve installed packages
      const retrieved_packages = await discover_installed_packages( kernel_name )

      console.log("packages installed (pip list)", retrieved_packages);
      const installed_packages = {}

      _.forIn(retrieved_packages, function(version, name) {
        if (_.has(packages, name.toLowerCase())) {
          if ( _.get(packages, name.toLowerCase()) == version) {
            _.set(installed_packages, name, version)
          }
        }
      })
      console.log("Installed packages:", installed_packages)

      return installed_packages
    }

    async checkInstalledPackages(installed_packages: {}, packages: {}): Promise<boolean> {

      // Check installed packages and verify pipfile.lock are all in installed list
      _.forIn(packages, function(version, name) {
        if (_.has(installed_packages, name.toLowerCase()) && _.get(installed_packages, name.toLowerCase()) == version ) {
            console.log( `Package '${ name }' in version '${ version }' is already installed` )
        }
        else {
          return false
        }
        }
      )

      return true
    }

    async createConfig() {
      const config_file = await retrieve_config_file( this.state.kernel_name);
      console.log("Config file", config_file);

      return config_file
    }

    render(): React.ReactNode {

      let dependencyManagementform = <div>
                                        <DependencyManagementForm
                                          loaded_packages={this.state.loaded_packages}
                                          installed_packages={this.state.installed_packages}
                                          packages={this.state.packages}
                                          editRow={this.editRow}
                                          storeRow={this.storeRow}
                                          deleteRow={this.deleteRow}
                                          editSavedRow={this.editSavedRow}
                                          deleteSavedRow={this.deleteSavedRow}
                                        />
                                      </div>

      let addPlusInstallContainers = <div>
                                        <div className={CONTAINER_BUTTON}>
                                          <div className={CONTAINER_BUTTON_CENTRE}>
                                          <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
                                          </div>
                                        </div>
                                        <div className={CONTAINER_BUTTON}>
                                          <div className={CONTAINER_BUTTON_CENTRE}>
                                            <DependencyManagementInstallButton
                                            changeUIstate={this.changeUIstate}
                                            install={this.lock_using_thoth} />
                                          </div>
                                        </div>
                                      </div>

      let addPlusSaveContainers = <div>
                                      <div className={CONTAINER_BUTTON}>
                                        <div className={CONTAINER_BUTTON_CENTRE}>
                                        <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
                                        </div>
                                      </div>
                                      <div className={CONTAINER_BUTTON}>
                                        <div className={CONTAINER_BUTTON_CENTRE}>
                                          <DependencyManagementSaveButton
                                            onSave={this.onSave}
                                            changeUIstate={this.changeUIstate} />
                                        </div>
                                      </div>
                                    </div>

    let optionsForm = <div>
                        <section>
                          <h2>OPTIONS</h2>
                        </section>

                        <form>
                          <label>
                            Kernel name:
                            <input
                              title="Kernel name"
                              type="text"
                              name="kernel_name"
                              value={this.state.kernel_name}
                              onChange={this.setKernelName}
                            />
                          </label>
                          <br />
                          <label>
                            Recommendation type:
                            <select onChange={() => this.changeRecommendationType}>
                              title="Recommendation Type"
                              name="recommendation_type"
                              value={this.state.recommendation_type}
                              <option value="latest">latest</option>
                              <option value="performance">performance</option>
                              <option value="security">security</option>
                              <option value="stable">stable</option>
                            </select>
                          </label>
                          </form>
                      </div>

      if ( this.state.status == "loading" ) {

        this.onStart( )

        return (
          <div>
          Loading...
          </div>
        )

      }

      if ( this.state.status == "initial" ) {

        return (
          <div>
            <div className={CONTAINER_BUTTON}>
              <div className={CONTAINER_BUTTON_CENTRE}>
              <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
              </div>
            </div>
            <div>
              <fieldset>
                <p> No dependencies found! Click New to add package. </p>
              </fieldset>
            </div>

          </div>
        );
      }

      if ( this.state.status == "no_reqs_to_save" ) {

        return (
          <div>
              {dependencyManagementform}
              {addPlusSaveContainers}
            <div>
              <fieldset>
                <p> Dependencies missing! Click New to add package. </p>
              </fieldset>
            </div>
          </div>
        );
      }

      if ( this.state.status == "only_install" ) {

        return (
          <div>
            {dependencyManagementform}
            {addPlusInstallContainers}

            <div>
              <fieldset>
                <p>Dependencies found in notebook metadata but lock file is missing. </p>
              </fieldset>
            </div>

            {optionsForm}
          </div>
        );
      }


      if ( this.state.status == "only_install_kernel" ) {

        return (
          <div>
            {dependencyManagementform}
            {addPlusInstallContainers}
            <div>
              <fieldset>
                <p>Pinned down software stack found in notebook metadata!<br></br>
                The kernel selected does not match the dependencies found for the notebook. <br></br>
                Please install them.</p>
              </fieldset>
            </div>
            {optionsForm}
          </div>
        );
      }

      if ( this.state.status == "only_install_kernel_re" ) {

        return (
          <div>
            {dependencyManagementform}
            {addPlusInstallContainers}
            <div>
              <fieldset>
                <p>Pinned down software stack found in notebook metadata!<br></br>
                The runtime environment found in the notebook does not match your environment. <br></br>
                Please use install button.</p>
              </fieldset>
            </div>
            {optionsForm}
          </div>
        );
      }

      if ( this.state.status == "editing" ) {
        return (
          <div>
            {dependencyManagementform}
            {addPlusSaveContainers}
          </div>
        );
      }

      if ( this.state.status == "saved" ) {
        return (
          <div>
            {dependencyManagementform}
            {addPlusInstallContainers}

            OPTIONS
            <div> Kernel name
              <input title="Kernel name"
                className={THOTH_KERNEL_NAME_INPUT}
                type="text"
                name="kernel_name"
                value={this.state.kernel_name}
                onChange={this.setKernelName}
              />
            </div>
          </div>
        );
      }

      if ( this.state.status == "locking_requirements" ) {
        return (
          <div>
            {dependencyManagementform}
            <fieldset>
              <p>Contacting thoth for advise... please be patient!</p>
            </fieldset>
          </div>
        );
      }

      if ( this.state.status == "installing_requirements" ) {

        this.install()

        return (
          <div>
            {dependencyManagementform}
            <fieldset>
              <p>Requirements locked and saved!<br></br>
              Installing new requirements...
              </p>
            </fieldset>
          </div>
        );
      }

      if ( this.state.status == "setting_kernel" ) {

        this.setKernel()

        return (
          <div>
            {dependencyManagementform}
            <fieldset>
              <p>Requirements locked and saved!<br></br>
              Requirements installed!<br></br>
              Setting new kernel for your notebook...
              </p>
            </fieldset>
          </div>
        );

      }

      if ( this.state.status == "failed_no_reqs" ) {

        return (
          <div>
            <div>
              <button
                title='Add requirements.'
                className={OK_BUTTON_CLASS}
                onClick={() => this.changeUIstate(
                  "loading",
                  this.state.packages,
                  this.state.loaded_packages,
                  this.state.installed_packages,
                  this.state.deleted_packages,
                  this.state.requirements,
                  this.state.kernel_name,
                  this.state.thoth_config,
                )
                }
                >
                Ok
              </button>
            </div>
            <div>
              <fieldset>
                <p>No requirements have been added please click add after inserting package name!</p>
              </fieldset>
            </div>
          </div>
      );

    }

      if ( this.state.status == "locking_requirements_using_pipenv" ) {

        return (
          <div>
            <fieldset>
              <p>Thoth resolution engine failed... pipenv will be used to lock dependencies!</p>
            </fieldset>
          </div>
      );

      }

      if ( this.state.status == "failed" ) {

        return (
          <div>
            {dependencyManagementform}
            <div>
              <div className={CONTAINER_BUTTON}>
                <div className={CONTAINER_BUTTON_CENTRE}>
                  <button
                    title='Finish.'
                    className={OK_BUTTON_CLASS}
                    onClick={() => this.changeUIstate(
                      "loading",
                      this.state.packages,
                      this.state.loaded_packages,
                      this.state.installed_packages,
                      this.state.deleted_packages,
                      this.state.requirements,
                      this.state.kernel_name,
                      this.state.thoth_config,
                    )
                    }
                    >
                    Ok
                  </button>
                </div>
              </div>
            </div>
            <div>
              <p>{this.state.error_msg}</p>
            </div>
          </div>
      );

      }

      if ( this.state.status == "stable" ) {

        return (
          <div>
            {dependencyManagementform}
            <div className={CONTAINER_BUTTON}>
              <div className={CONTAINER_BUTTON_CENTRE}>
              <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
              </div>
            </div>
            <div>
              <fieldset>
                <p> Everything installed and ready to use!</p>
              </fieldset>
            </div>
          </div>
        );
      }

      if ( this.state.status == "ready" )

        this.props.panel.sessionContext.session.changeKernel({"name": this.state.kernel_name})

        return (
          <div>
            {dependencyManagementform}
            <div>
              <div className={CONTAINER_BUTTON}>
                  <div className={CONTAINER_BUTTON_CENTRE}>
                    <button
                      title='Reload Page and assign kernel.'
                      className={OK_BUTTON_CLASS}
                      onClick={() => this.changeUIstate(
                        "stable",
                        this.state.packages,
                        this.state.loaded_packages,
                        this.state.installed_packages,
                        this.state.deleted_packages,
                        this.state.requirements,
                        this.state.kernel_name,
                        this.state.thoth_config,
                      )
                      }
                      >
                      Ok
                    </button>
                  </div>
              </div>
            </div>
            <div>
                <fieldset>
                  <p>Requirements locked and saved!<br></br>
                  Requirements installed!<br></br>
                  New kernel created!<br></br>
                  Click ok to start working on your notebook.<br></br>
                  </p>
                </fieldset>
            </div>
          </div>
      );

    }
}
