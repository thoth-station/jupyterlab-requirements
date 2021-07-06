/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Francesco Murdaca <fmurdaca@redhat.com>
 * @since  0.8.0
 */

import _ from "lodash";
import React from 'react';
import { INotification } from "jupyterlab_toastify";

import { KernelHandlerDeleteButton } from './KernelHandlerDeleteButton'

import {
  get_kernel_list,
  delete_kernel
} from '../kernel'

const CONTAINER_BUTTON = "thoth-container-button";
const CONTAINER_BUTTON_CENTRE = "thoth-container-button-centre";

/**
 * Class: Holds properties for KernelHandlerWidget.
 */

interface IKernelHandlerProps {}

/**
 * Class: Holds state for KernelHandlerWidget.
 */

export interface IKernelHandlerState {
  kernels: Array<string>,
  kernel_name: string,
  status: string
}

export class KernelHandlerWidget extends React.Component<IKernelHandlerProps, IKernelHandlerState> {
    constructor(
      props: IKernelHandlerProps
    ) {
      super(props);

      this.state = {
          kernels: [],
          kernel_name: "jupyterlab-requirements",
          status: "loading"
      }

      this.changeUIstate = this.changeUIstate.bind(this)
    }

    changeUIstate(ui_state: IKernelHandlerState) {

      this.setState(ui_state);
    }

    /**
     * Function: Set kernel to be deleted
     */

    setKerneltoDelete(kernel_name: string) {

      this.setState(
        {
          kernel_name: kernel_name
        }
      );
    }

    /**
     * Function: Set kernel to be deleted
     */

    async onDeleteKernel(kernel_name: string, kernels: Array<string>, state: IKernelHandlerState) {

      const kernel_to_delete = kernel_name
      console.log("Kernel to be deleted:", kernel_to_delete)

      const message = await delete_kernel(kernel_to_delete)
      console.log("After attempt to delete kernel...", message)

      INotification.warning(kernel_to_delete + " jupyter kernel has been deleted...")

      var current_kernels = kernels

      var new_kernels: Array<string> = []

      _.forEach(current_kernels, function(kernel) {
          if ( kernel == kernel_to_delete ) {
            new_kernels.push(kernel)
          }
      })

      var ui_on_delete_state = state

      _.set(ui_on_delete_state, "kernels", new_kernels)
      _.set(ui_on_delete_state, "status", "loading")

      return ui_on_delete_state
    }

    async onStart() {

      const kernels = await get_kernel_list()
      console.log("kernels retrieved", kernels)

      var ui_on_start_state = this.state

      _.set(ui_on_start_state, "kernels", kernels)

      console.log("Number of kernels:", _.size(kernels))

      if ( _.size(kernels) >= 1) {
        _.set(ui_on_start_state, "kernel_name", kernels[0])
        _.set(ui_on_start_state, "status", "ready")
      }
      else {
          _.set(ui_on_start_state, "kernel_name", "jupyterlab-requirements")
          _.set(ui_on_start_state, "status", "empty")
      }

      this.setState(ui_on_start_state);
      return
    }

    createSelectItems() {
      let items: any = [];
      _.forEach(this.state.kernels, function(kernel) {
          items.push(<option key={kernel} value={kernel}>{kernel}</option>);
      })
      return items;
    }

    render(): React.ReactNode {

      let deleteContainer = <div>
                              <div className={CONTAINER_BUTTON}>
                                <div className={CONTAINER_BUTTON_CENTRE}>
                                  <KernelHandlerDeleteButton
                                    onDeleteKernel={this.onDeleteKernel}
                                    ui_state={this.state}
                                    changeUIstate={this.changeUIstate}/>
                                </div>
                              </div>
                            </div>

        var ui_status = this.state.status

        console.log(this.state)

        switch(ui_status) {

          case "loading":

            this.onStart()
            return (
                <div>
                  Checking kernels
                </div>
            );

          case "empty":

            return (
                <div>
                  No kernels to be removed
                </div>
              );

          case "delete":

            return (
                <div>
                  Deleting kernel
                </div>
              );

          case "ready":

            return (
              <div>
                Select Kernel to be deleted <br></br>
                <label>
                <select onSelect={() => this.setKerneltoDelete}>
                  title="Jupyter kernel to be deleted"
                  name="kernel_name"
                  value={this.state.kernel_name}
                  {this.createSelectItems()}
                </select>
              </label>
              {deleteContainer}
              </div>
            );

          }
      }
  }
