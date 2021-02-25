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

import { requestAPI, THOTH_JUPYTER_INTEGRATION_API_BASE_NAME } from './handler';
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
  init: RequestInit = {}
): Promise<string> {

  // PUT request
  const dataToSend = {
    runtime_environment: runtime_environment,
    force: force
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

export async function lock_requirements_with_thoth (
  kernel_name: string,
  thoth_config: string,
  requirements: string,
  init: RequestInit = {},
): Promise<Advise> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name,
    thoth_config: thoth_config,
    requirements: requirements
  };

  const endpoint: string = 'thoth/resolution'
  try {
    const advise = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    console.log("Advise requirements received: ", advise.requirements)
    return JSON.parse(JSON.stringify(advise));
  } catch (reason) {
    console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}

export async function lock_requirements_with_pipenv (
  kernel_name: string,
  requirements: string,
  init: RequestInit = {},
): Promise<PipenvResult> {

  // POST request
  const dataToSend = {
    kernel_name: kernel_name,
    requirements: requirements
  };

  const endpoint: string = 'pipenv'

  try {
    const result = await requestAPI<any>(endpoint, {
      body: JSON.stringify(dataToSend),
      method: 'POST'
    });
    return JSON.parse(JSON.stringify(result));
  } catch (reason) {
    console.error('Error on POST /' + THOTH_JUPYTER_INTEGRATION_API_BASE_NAME + '/' + endpoint + ':', reason);
  }
}
