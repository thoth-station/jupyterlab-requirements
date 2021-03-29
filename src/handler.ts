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

/**
 * Jupyterlab tutorials: https://github.com/jupyterlab/extension-examples/blob/master/server-extension/src/handler.ts
 */

import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

export const THOTH_JUPYTER_INTEGRATION_API_BASE_NAME = "jupyterlab_requirements";

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param requestInit Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  requestInit: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API

  // Retrieve server setting
  const settings = ServerConnection.makeSettings();

  // build the full request URL
  const requestUrl = URLExt.join(
    settings.baseUrl,
    THOTH_JUPYTER_INTEGRATION_API_BASE_NAME,
    endPoint
  );

  let response: Response;

  // Make actual request
  try {
    response = await ServerConnection.makeRequest(requestUrl, requestInit, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message);
  }

  return data;

// TODO: Differentiate between response status

//   /**
//  * Function: https://github.com/elyra-ai/elyra/blob/5664d53029b57ed25067cd454d5c1e16de98b282/packages/services/src/requests.ts#L186.
//  */

//   const getServerResponse: Promise<any> = new Promise((resolve, reject) => {
//     ServerConnection.makeRequest(requestUrl, requestInit, settings).then(
//       (response: any) => {

//         response.json().then(
//           // handle cases where the server returns a valid response
//           (result: any) => {
//             if (response.status < 200 || response.status >= 300) {
//               return reject(result);
//             }

//             resolve(result);
//           },
//           // handle 404 if the server is not found
//           (reason: any) => {
//             if (response.status == 404) {
//               response['requestUrl'] = requestUrl;
//               return reject(response);
//             } else if (response.status == 204) {
//               resolve({});
//             } else {
//               return reject(reason);
//             }
//           }
//         );
//       },

//       // something unexpected went wrong with the request
//       (reason: any) => {
//         console.error(reason);
//         return reject(reason);
//       }
//     );
//   });

//   const serverResponse: any = await getServerResponse;
//   return serverResponse;
}
