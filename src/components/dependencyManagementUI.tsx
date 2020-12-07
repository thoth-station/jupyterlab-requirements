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
// import { ReactComponent as Icon } from '../types/assets/save.svg';
{/* <button>
<Icon className='thoth-save-button' /> Save
</button> */}

import { NotebookPanel } from '@jupyterlab/notebook';

import { DependencyManagementForm } from './dependencyManagementForm'
import { DependencyManagementSaveButton } from './dependencyManagementSaveButton'
import { DependencyManagementInstallButton } from './dependencyManagementInstallButton'
import { DependencyManagementNewPackageButton } from './dependencyManagementAddPackageButton';

import { get_python_version } from "../notebook";
import { Source, Requirements, RequirementsLock } from '../types/requirements';

import { ThothConfig } from '../types/thoth';

import { 
  discover_installed_packages,
  store_dependencies,
  install_packages,
  create_new_kernel
} from '../kernel';

import {
  get_config_file,
  lock_requirements_with_thoth,
  lock_requirements_with_pipenv
} from '../thoth';

import {
  set_requirements,
  set_requirement_lock,
  set_thoth_configuration
} from "../notebook"

import { Advise } from "../types/thoth";

/**
 * The class name added to the new package button (CSS).
 */
const OK_BUTTON_CLASS = "thoth-ok-button";
const THOTH_KERNEL_NAME_INPUT = "thoth-kernel-name-input";

/**
 * Class: Holds properties for DependenciesManagementDialog.
 */

interface IProps {
  panel: NotebookPanel,
  initial_requirements: Requirements,
  initial_requirements_lock: RequirementsLock,
  initial_config_file: ThothConfig
}

/**
 * Class: Holds state for DependenciesManagementDialog.
 */

export interface IState {
  kernel_name: string
  status: string,
  packages: { [ name: string ]: string },
  installed_packages: { [ name: string ]: string },
  initial_packages: { [ name: string ]: string },
  requirements: Requirements
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
      this.editSavedRow = this.editSavedRow.bind(this),
      this.storeRow = this.storeRow.bind(this),
      this.deleteRow = this.deleteRow.bind(this),
      this.deleteSavedRow = this.deleteSavedRow.bind(this),
      this.onSave = this.onSave.bind(this),
      this.checkInstalledPackages = this.checkInstalledPackages.bind(this),
      this.install = this.install.bind(this),
      this.install_backup = this.install_backup.bind(this),
      this.createConfig = this.createConfig.bind(this),
      this.setKernelName = this.setKernelName.bind(this)

      this.state = {
        kernel_name: "jupyterlab_requirements",
        status: "loading",
        packages: {},  // editing
        initial_packages: {},
        installed_packages: {},
        requirements: {
          packages: {},
          requires: { python_version: get_python_version( this.props.panel ) },
          sources: [new Source()]
        }
      }
    }

    /**
     * Function: Main function to change state and status!
     */

    changeUIstate(
      status: string, 
      packages?: { [ name: string ]: string },
      initial_packages?: { [ name: string ]: string },
      installed_packages?: { [ name: string ]: string },
      requirements?: Requirements
    ) {

      var new_state: IState = this.state
      console.log("initial", new_state)

      _.set(new_state, "status", status)

      _.set(new_state, "packages", packages)

      _.set(new_state, "initial_packages", initial_packages)

      _.set(new_state, "installed_packages", installed_packages)

      _.set(new_state, "requirements", requirements)

      console.log("new", new_state)
      this.setState(new_state);
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
        this.state.initial_packages,
        this.state.installed_packages,
        this.state.requirements
      )
    }

    /**
     * Function: Edit saved row
     */

    editSavedRow(package_name: string, package_version: string) {

      const initial_packages = this.state.initial_packages
      const packages = this.state.packages

      _.unset(initial_packages, package_name)
      _.set(packages, package_name, package_version)

      console.log("After editing (initial)", initial_packages)
      console.log("After editing (current)", packages)

      this.changeUIstate(
        "editing",
        packages,
        initial_packages,
        this.state.installed_packages,
        this.state.requirements
      )

    }

    /**
     * Function: Delete row not saved
     */

    deleteRow(package_name: string) {

      const packages = this.state.packages

      _.unset(packages, package_name)

      console.log("After deleting", packages)

      this.changeUIstate(
        "editing",
        packages,
        this.state.initial_packages,
        this.state.installed_packages,
        this.state.requirements
      )

    }

    /**
     * Function: Delete row saved
     */

    deleteSavedRow(package_name: string) {

      const saved_packages = this.state.initial_packages

      _.unset(saved_packages, package_name)

      console.log("After deleting saved", saved_packages)

      this.changeUIstate(
        "editing",
        this.state.packages,
        saved_packages,
        this.state.installed_packages,
        this.state.requirements
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
        this.state.initial_packages,
        this.state.installed_packages,
        this.state.requirements
      )

    }

    /**
     * Function: Save button to store every input in notebook
     */

    onSave() {

      const notebookMetadataRequirements = this.state.requirements
      const added_packages = this.state.packages
      console.log("added_packages", added_packages)
      const initial_packages = this.state.initial_packages
      console.log("initial_packages", initial_packages)

      // Evaluate total package from initial + added
      const total_packages = {}

      _.forIn(initial_packages, function(value, key) {
        if (_.has(initial_packages, "") == false) {
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

      // Check if there are packages saved, otherwise go to failed notification message
      if ( _.size(total_packages ) > 0 ) {

        if ( _.isEqual(total_packages, this.state.installed_packages) ){

          this.changeUIstate(
            "stable",
            this.state.packages,
            this.state.initial_packages,
            this.state.installed_packages,
            this.state.requirements
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
            finalRequirements
          )

          return 
        }

      }
      else {

        var emptyRequirements: Requirements = {
          packages: total_packages,
          requires: notebookMetadataRequirements.requires,
          sources: notebookMetadataRequirements.sources
        }

        console.log("Requirements are: ", emptyRequirements)

        // Set requirements in notebook;
        set_requirements( this.props.panel , emptyRequirements )

        this.changeUIstate(
          "failed_no_reqs",
          new_packages,
          this.state.initial_packages,
          this.state.installed_packages,
          this.state.requirements
        )
        return
      }
    }

    async install() {

      this.changeUIstate(
        "locking_requirements",
        this.state.packages,
        this.state.initial_packages,
        this.state.installed_packages,
        this.state.requirements
      )

      const notebook_path = this.props.panel.context.path.toString();

      const thothConfig: ThothConfig = await this.createConfig();
      console.log("thoth config submitted", JSON.stringify(thothConfig));

      const notebookMetadataRequirements = this.state.requirements;
      console.log("Requirements submitted", JSON.stringify(notebookMetadataRequirements));

      try {

        const advise: Advise = await lock_requirements_with_thoth(
          notebook_path,
          JSON.stringify(thothConfig),
          JSON.stringify(notebookMetadataRequirements)
        );
        console.log("Advise received", advise);

        if ( advise.error == false ) {
          // Set requirements in notebook;
          set_requirements( this.props.panel , advise.requirements )
          set_requirement_lock( this.props.panel , advise.requirement_lock )
          set_thoth_configuration( this.props.panel , thothConfig )

          // TODO: Requested from the user (in this case it is to install them)
          const store_message: string = await store_dependencies(
            notebook_path,
            JSON.stringify(advise.requirements),
            JSON.stringify(advise.requirement_lock)
          );

          console.log("Store message", store_message);

          this.changeUIstate(
            "installing_requirements",
            {},
            this.state.initial_packages,
            this.state.installed_packages,
            advise.requirements
          )

          // Install dependencies in the kernel using selected resolution engine
          const install_message = await install_packages( notebook_path );
          console.log("Install message", install_message);

          this.changeUIstate(
            "setting_kernel",
            {},
            this.state.initial_packages,
            this.state.initial_packages,
            advise.requirements
          )

          const message = await create_new_kernel( notebook_path, this.state.kernel_name );
          console.log("Kernel message", message);

          this.changeUIstate(
            "ready",
            {},
            this.state.initial_packages,
            this.state.initial_packages,
            advise.requirements
          )

          this.changeUIstate( "ready" )
        }
        else {

          this.install_backup()
        }

      } catch ( error ) {

        console.log(error)

        this.install_backup()
      }

    }

    async install_backup () {

      this.changeUIstate(
        "installing_requirements_using_pipenv",
        this.state.packages,
        this.state.initial_packages,
        this.state.installed_packages,
        this.state.requirements
      )

      const notebook_path = this.props.panel.context.path.toString();

      const notebookMetadataRequirements = this.state.requirements;
      console.log("Requirements for pipenv", JSON.stringify(notebookMetadataRequirements));

      try {
        
        // TODO: Add check to avoid relocking if dependencies are already locked.
        const result = await lock_requirements_with_pipenv(
          notebook_path,
          JSON.stringify(notebookMetadataRequirements)
        )
        console.log("Result received", result);

        if ( result.error == false ) {

          set_requirement_lock( this.props.panel , result.requirements_lock )

          this.changeUIstate(
            "setting_kernel",
            {},
            this.state.initial_packages,
            this.state.initial_packages,
            notebookMetadataRequirements
          )

          this.changeUIstate(
            "installing_requirements",
            {},
            this.state.initial_packages,
            this.state.installed_packages,
            notebookMetadataRequirements
          )

          const is_installed = await install_packages( notebook_path, this.state.kernel_name );
          console.log("installed packages message", is_installed);

          const is_created = await create_new_kernel( notebook_path, this.state.kernel_name );
          console.log("Kernel message", is_created);
          
          // TODO: make this automatic for user
          // this.props.panel.sessionContext.session.changeKernel()

          this.changeUIstate(
            "ready",
            {},
            this.state.initial_packages,
            this.state.initial_packages,
            notebookMetadataRequirements
          )
          return 
        }

        else {

          this.changeUIstate(
            "failed",
            this.state.packages,
            this.state.initial_packages,
            this.state.installed_packages,
            this.state.requirements
          )
          return
        }

      } catch ( error ) {

        console.log(error)
    
        this.changeUIstate(
          "failed",
          this.state.packages,
          this.state.initial_packages,
          this.state.installed_packages,
          this.state.requirements
        )
        return 

      }
    } 

    async onStart(panel: NotebookPanel) {

        // Load requirements from notebook metadata if any otherwise receive default one
        var initial_requirements: Requirements = this.props.initial_requirements
        console.log("initial requirements", initial_requirements)
        var initial_packages = initial_requirements.packages

        // Check if any package is present in the loaded requirements otherwise go to initial state
        if ( _.size( initial_packages ) == 0 ) {
          this.changeUIstate(
            status="initial" ,
            this.state.packages,
            initial_packages,
            this.state.installed_packages,
            initial_requirements
          )
          return
        }

        // requirements is present in notebook metadata

        // Load requirements lock from notebook metadata ( if any )
        const initial_requirements_lock = this.props.initial_requirements_lock

        // Check if requirements locked are present
        if ( initial_requirements_lock == null ) {
          this.changeUIstate(
            status="only_install" ,
            this.state.packages,
            initial_packages,
            this.state.installed_packages,
            initial_requirements
          )
          return
        }

        const initial_locked_packages = {}
        // requirements and requirements locked is present in notebook metadata

        // Retrieve packages locked
        _.forIn(initial_requirements_lock.default, function(value, package_name) {
          _.set(initial_locked_packages, package_name, value.version.replace("==", ""))
        })
        console.log(initial_locked_packages)

        // check if all requirements locked are also installed in the current kernel
        const are_installed: boolean = await this.checkInstalledPackages(initial_locked_packages)

        // if locked requirments are present in the kernel (match packages installed), go to stable state
        if ( are_installed == true ) {

          this.changeUIstate(
            "stable",
            this.state.packages,
            initial_packages,
            initial_packages,
            initial_requirements
            )

          return
        }

        // if locked requirements are not present or not all present in the kernel, go to only_install state
        else {
          this.changeUIstate(
            "only_install",
            this.state.packages,
            initial_packages,
            this.state.installed_packages,
            initial_requirements
            )
          return
        }
    }

    async checkInstalledPackages(packages: {}): Promise<boolean> {

      // Check installed packages
      const notebook_path = this.props.panel.context.path.toString();
      const retrieved_packages = await discover_installed_packages( notebook_path, this.state.kernel_name );

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

      if (_.isEqual(_.size(packages), _.size(installed_packages) )) {
        return true
      }

      else {
        return false
      }

    }

    async createConfig() {
      // TODO: Use config created automatically by thamos??
      const config_file = await get_config_file();
      console.log("Config file", config_file);

      return config_file
    }

    render(): React.ReactNode {

      let styles =  "float:left"
      // var ui = []

      if ( this.state.status == "loading" ) {

        this.onStart( this.props.panel )

        return (
          <div>
          Loading...
          </div>
        )

      }

      if ( this.state.status == "initial" ) {

        return (
          <div>
            <div>
              <DependencyManagementForm
              initial_packages={this.state.initial_packages}
              installed_packages={this.state.installed_packages}
              packages={this.state.packages}
              storeRow={this.storeRow}
              deleteRow={this.deleteRow}
              editSavedRow={this.editSavedRow}
              deleteSavedRow={this.deleteSavedRow}/>
            </div>
            <div className={styles} >
              <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
            </div>
            <div className={styles} >
              <DependencyManagementSaveButton
              onSave={this.onSave}
              changeUIstate={this.changeUIstate} />
            </div>
            <div>
              <p> No dependencies found! Click New to add package. </p>
            </div>
            
          </div>
        );
      }

      if ( this.state.status == "no_reqs_to_save" ) {

        return (
          <div>
            <div>
              <DependencyManagementForm
              initial_packages={this.state.initial_packages}
              installed_packages={this.state.installed_packages}
              packages={this.state.packages}
              storeRow={this.storeRow}
              deleteRow={this.deleteRow}
              editSavedRow={this.editSavedRow}
              deleteSavedRow={this.deleteSavedRow}/>
            </div>
            <div>
              <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
            </div>
            <div>
              <DependencyManagementSaveButton
              onSave={this.onSave}
              changeUIstate={this.changeUIstate} />
            </div>
            <p> Dependencies missing! Click New to add package. </p>
          </div>
        );
      }

      if ( this.state.status == "only_install" ) {

        return (
          <div>
            <div>
              <DependencyManagementForm
              initial_packages={this.state.initial_packages}
              installed_packages={this.state.installed_packages}
              packages={this.state.packages}
              storeRow={this.storeRow}
              deleteRow={this.deleteRow}
              editSavedRow={this.editSavedRow}
              deleteSavedRow={this.deleteSavedRow}/>
            </div>
            <div>
              <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
            </div>
            <div>
              <DependencyManagementInstallButton 
              changeUIstate={this.changeUIstate}
              install={this.install_backup} />
            </div>

            <div>
              <p>Dependencies found in notebook metadata but lock file is missing. </p>
            </div>

            <br></br> OPTIONS

            <div> 
            Kernel name <input title="Kernel name"
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

      if ( this.state.status == "editing" ) {
        return (
          <div>
            <div>
              <DependencyManagementForm
              initial_packages={this.state.initial_packages}
              installed_packages={this.state.installed_packages}
              packages={this.state.packages}
              storeRow={this.storeRow}
              deleteRow={this.deleteRow}
              editSavedRow={this.editSavedRow}
              deleteSavedRow={this.deleteSavedRow}
              />
            </div>
            <div>
              <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
            </div>
            <div>
              <DependencyManagementSaveButton
              onSave={this.onSave}
              changeUIstate={this.changeUIstate} />
            </div>
          </div>
        );
      }

      if ( this.state.status == "saved" ) {
        return (
          <div>
            <div>
              <DependencyManagementForm
              initial_packages={this.state.initial_packages}
              installed_packages={this.state.installed_packages}
              packages={this.state.packages}
              storeRow={this.storeRow}
              deleteRow={this.deleteRow}
              editSavedRow={this.editSavedRow}
              deleteSavedRow={this.deleteSavedRow}/>
            </div>
            <div>
              <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
            </div>
            <div>
              <DependencyManagementInstallButton 
              changeUIstate={this.changeUIstate}
              install={this.install} />
            </div>

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
            <div>
              <DependencyManagementForm
              initial_packages={this.state.initial_packages}
              installed_packages={this.state.installed_packages}
              packages={this.state.packages}
              storeRow={this.storeRow}
              deleteRow={this.deleteRow}
              editSavedRow={this.editSavedRow}
              deleteSavedRow={this.deleteSavedRow}/>
            </div>
            <fieldset>
              <p>Contacting thoth for advise... please be patient!</p>
            </fieldset>
          </div>
        );
      }

      if ( this.state.status == "installing_requirements" )
      return (
        <div>
          <div>
            <DependencyManagementForm
            initial_packages={this.state.initial_packages}
            installed_packages={this.state.installed_packages}
            packages={this.state.packages}
            storeRow={this.storeRow}
            deleteRow={this.deleteRow}
            editSavedRow={this.editSavedRow}
            deleteSavedRow={this.deleteSavedRow}/>
          </div>
          <fieldset>
          <p>Requirements locked and saved!<br></br>
          Installing new requirements...
          </p>
          </fieldset>
        </div>
      );

      if ( this.state.status == "setting_kernel" )
      return (
        <div>
          <div>
            <DependencyManagementForm
            initial_packages={this.state.initial_packages}
            installed_packages={this.state.installed_packages}
            packages={this.state.packages}
            storeRow={this.storeRow}
            deleteRow={this.deleteRow}
            editSavedRow={this.editSavedRow}
            deleteSavedRow={this.deleteSavedRow}/>
          </div>
          <fieldset>
            <p>Requirements locked and saved!<br></br>
            Requirements installed!<br></br>
            Setting new kernel for your notebook...
            </p>
          </fieldset>
        </div>
      );

      if ( this.state.status == "failed_no_reqs" )
        return (
          <div>
            <div>
              <DependencyManagementForm
              initial_packages={this.state.initial_packages}
              installed_packages={this.state.installed_packages}
              packages={this.state.packages}
              storeRow={this.storeRow}
              deleteRow={this.deleteRow}
              editSavedRow={this.editSavedRow}
              deleteSavedRow={this.deleteSavedRow}/>
            </div>
            <div className={styles}>
              <button
                title='Add requirements.'
                className={OK_BUTTON_CLASS}
                onClick={() => this.changeUIstate( 
                  "loading",
                  this.state.packages,
                  this.state.initial_packages,
                  this.state.installed_packages,
                  this.state.requirements
                )
                }
                >
                Ok
              </button>
            </div>
            <div>
              <p>No requirements have been added please click add after inserting package name!</p>
            </div>
          </div>
      );
      
      if ( this.state.status == "installing_requirements_using_pipenv" )
        return (
          <div>
            <p>Thoth resolution engine failed... pipenv will be used to lock and install dependencies!</p>
          </div>
      );

      if ( this.state.status == "failed" )
        return (
          <div>
            <div>
              <DependencyManagementForm
              initial_packages={this.state.initial_packages}
              installed_packages={this.state.installed_packages}
              packages={this.state.packages}
              storeRow={this.storeRow}
              deleteRow={this.deleteRow}
              editSavedRow={this.editSavedRow}
              deleteSavedRow={this.deleteSavedRow}/>
            </div>
            <div className={styles} >
              <button
                title='Finish.'
                className={OK_BUTTON_CLASS}
                onClick={() => this.changeUIstate( 
                  "loading",
                  this.state.packages,
                  this.state.initial_packages,
                  this.state.installed_packages,
                  this.state.requirements
                )
                }
                >
                Ok
              </button>
            </div>
            <div>
                <p>pipenv resolution engine failed... please contact Thoth team!</p>
            </div>
          </div>
      );

      if ( this.state.status == "stable" ) {

        this.props.panel.sessionContext.session.changeKernel({"name": this.state.kernel_name})

        return (
          <div>
            <DependencyManagementForm
            initial_packages={this.state.initial_packages}
            installed_packages={this.state.installed_packages}
            packages={this.state.packages}
            storeRow={this.storeRow}
            deleteRow={this.deleteRow}
            editSavedRow={this.editSavedRow}
            deleteSavedRow={this.deleteSavedRow}/>
            <div>
              <DependencyManagementNewPackageButton addNewRow={this.addNewRow} />
            </div>
            <div>
                <p> Everything installed and ready to use!</p> 
            </div>
          </div>
        );
      }

      if ( this.state.status == "ready" )
        return (
          <div>
            <DependencyManagementForm
            initial_packages={this.state.initial_packages}
            installed_packages={this.state.installed_packages}
            packages={this.state.packages}
            storeRow={this.storeRow}
            deleteRow={this.deleteRow}
            editSavedRow={this.editSavedRow}
            deleteSavedRow={this.deleteSavedRow}/>
            <div className={styles} >
                <button
                  title='Reload Page and assign kernel.'
                  className={OK_BUTTON_CLASS}
                  onClick={() => this.changeUIstate( 
                    "stable",
                    this.state.packages,
                    this.state.initial_packages,
                    this.state.installed_packages,
                    this.state.requirements
                  )
                  }
                  >
                  Ok
                </button>
            </div>
            <div>
                <fieldset>
                  <p>Requirements locked and saved!<br></br>
                  Requirements installed!<br></br>
                  New kernel created!<br></br>
                  Click ok to shutdown current kernel and start new one.<br></br>
                  </p>
                </fieldset>
            </div>
          </div>
      );

    }
}
