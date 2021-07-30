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

import { requestAPI, THOTH_JUPYTER_INTEGRATION_API_BASE_NAME, AsyncTaskHandler } from './handler';
import { Advise, PipenvResult, ThothConfig, RuntimeEnvironment } from './types/thoth';

export async function retrieve_config_file (
  kernel_name: string,
  init: RequestInit = {}
): Promise<ThothConfig> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name,
  };

  const endpoint: string = 'thoth/config'
  try {
    const thoth_config = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(thoth_config));
  } catch (reason) {
    console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}

export async function update_thoth_config_on_disk (
  runtime_environment: RuntimeEnvironment,
  force: boolean,
  complete_path: string,
  init: RequestInit = {}
): Promise<string> {

  // PUT request
  const dataToSend = {
    runtime_environment: runtime_environment,
    force: force,
    complete_path: complete_path
  };

  const endpoint: string = 'thoth/config'
  try {
    const thoth_config = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'PUT'
    });
    return JSON.parse(JSON.stringify(thoth_config));
  } catch (reason) {
    console.error('Error on PUT /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }

}

export async function lock_requirements_with_thoth(
  kernel_name: string,
  thoth_timeout: number,
  thoth_force: boolean,
  notebook_content: string,
  thoth_config: string,
  requirements: string,
): Promise<Advise|undefined> {
  try {
    // POST request
    const dataToSend = {
      kernel_name: kernel_name,
      thoth_timeout: thoth_timeout,
      thoth_force: thoth_force,
      notebook_content: notebook_content,
      thoth_config: thoth_config,
      requirements: requirements
    };
    const request: RequestInit = {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    };
    var endpoint = "thoth/resolution"
    const { promise } = AsyncTaskHandler(
      endpoint,
      request
    );
    const response = await promise;
    if (response) {
      // this._uiStateChanged.emit({
      //   type: 'locked'
      // });
      return JSON.parse(JSON.stringify(response));
    }
  } catch (error) {
      let message: string = error.message || error.toString();

      if ( message == 'gateway_error') {
        console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
        message = "Gateway error while locking dependencies with thoth.";
      }
      else if ( message !== 'cancelled') {
        console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
        message = `An error occurred while asking advise to Thoth.`;
      }

      else {
        console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
        message = "Task was cancelled due to some issue.";
      }

      throw new Error(message)
  }
}


export async function lock_requirements_with_pipenv(
  kernel_name: string,
  requirements: string,
): Promise<PipenvResult|undefined> {
  try {
    // POST request
    const dataToSend = {
      kernel_name: kernel_name,
      requirements: requirements
    };
    const request: RequestInit = {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    };
    var endpoint = "pipenv"
    const { promise } = AsyncTaskHandler(
      endpoint,
      request
    );
    const response = await promise;
    if (response) {
      // this._uiStateChanged.emit({
      //   type: 'locked'
      // });
      return JSON.parse(JSON.stringify(response));
    }
  } catch (error) {
      let message: string = error.message || error.toString();

      if ( message == 'gateway_error') {
        console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
        message = "Gateway error while locking dependencies with pipenv.";
      }
      else if ( message !== 'cancelled') {
        console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
        message = "An error occurred while locking dependencies with pipenv.";
      }
      else {
        console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', message);
        message = "Task was cancelled due to some issue.";
      }

      throw new Error(message)
  }
}
