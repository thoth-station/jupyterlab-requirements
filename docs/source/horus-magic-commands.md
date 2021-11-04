# Horus magic commands

As of `v0.10.0` jupyterlab-requirements supports `%horus` magic command directly in the cells so that the user can speed up all dependency management taks, working in one place. Magic commands are automatically loaded when you start a notebook and they automatically identify the notebook you are using.

To learn more about how to use the `%horus` magic commands check out the documentation below or the video [here](https://www.youtube.com/watch?v=FjVxNTXO70I).


## Magic commands

Here you can find a list of magic commands available and a description for each of them.

### check
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus check |  | Check notebook metadata content about dependencies: `requirements`, `requirements_lock`, `dependency_resolution_engine`, `thoth_configuration_file` (only for Thoth resolution engine). |

### convert
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus convert |  | Convert notebook cells with pip commands to use horus commands in order to allow reproducibility. Have a look at this [video](https://www.youtube.com/watch?v=SFui8yrMVjw) to know more about this command. |

### discover
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus discover |  | Discover dependencies used from notebook content, create a Pipfile (empty if packages are not identified) and stores it in notebook metadata NOTE: _Please keep in mind this feature is under development and the packages identified need to be checked by humans._ |
|  | --force | Force saving Pipfile in notebook metadata. This can be used if a Pipfile already exists for the notebook created. |

### extract
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus extract |  | Extract dependencies content from notebook metadata (if they exist) and store it locally. By default it will try to extract all content. It will fail if the content already exist locally. NOTE: _Please keep in mind the `.thoth.yaml` will be stored at the root of the repo._ |
|  | --force | Force saving notebook metadata locally. This can be used if the content already exist locally. |
|  | --store-files-path {PATH} | You can provide a specific path where to store the content. |
|  | --pipfile | It will extract and save locally only the Pipfile. It will fail if the Pipfile exists at that path. |
|  | --pipfile-lock | It will extract and save locally only the Pipfile.lock. It will fail if the Pipfile.lock exists at that path. |
|  | --thoth-config | It will extract and save locally only the .thoth.yaml. It will fail if the .thoth.yaml exists at that path. |

### help
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus help | | See all commands available in horus. |

### lock with Thoth
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus lock |  | Resolve dependencies using Thoth resolution engine, install them in the kernel (default to `jupyterlab-requirements`) and save them in the notebook metadata. |
|  | --force | Force request if one analysis result already exists. |
|  | --debug | Enable debug/verbose request. NOTE: It has an impact on the quality of the resolution process. |
|  | --set-timeout {TIMEOUT_INT} | Set the timeout [seconds] for the recommendation to be provied. |
|  | --recommendation-type {RECOMMENDATION_TYPE} | Recommendation type used in the request: `latest` (default), `stable`, `performance`, `security`. |
|  | --os-name {OS_NAME} | Operating System name used in request. |
|  | --os-version {OS_NAME} | Operating System version used in request. |
|  | --python-version {OS_NAME} | Python Interpreter version used in request. |
|  | --kernel-name {KERNEL_NAME} | You can select the {KERNEL_NAME} where the dependencies will be installed |

### lock with Pipenv
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus lock | --pipenv | Resolve dependencies using Pipenv resolution engine, install them in the kernel (default to `jupyterlab-requirements`) and save them in the notebook metadata. |
|  | --kernel-name {KERNEL_NAME} | You can select the {KERNEL_NAME} where the dependencies will be installed |

### requirements
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus requirements | --add {REQUIREMENT} | Add requirement to Pipfile in your notebook: `tensorflow`, `tensorflow==2.6.0`, `'importlib-metadata; python_version < "3.8"'`. NOTE: _If the Pipfile does not exists it is created automatically._ |
|  | --add --dev {REQUIREMENT} | Add development requirement to Pipfile in your notebook: `--dev 'pytest~=6.2.0'`. |
|  | --remove {REQUIREMENT} | Remove requirementfrom Pipfile in your notebook: `tensorflow` |

### set-kernel
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus set-kernel |  | Prepare environment for the notebook to run (create kernel (if does not exist) and install dependencies from notebook metadata (if they exist)) |
|  | --force | This command will delete existint kernel with that name and recreate it. |

### show
| magic command | options | description |
| ------------- | ------------------ | ------------------ |
| %horus show |  | Show dependencies content from notebook metadata (if they exist) |
|  | --pipfile | It will show only the Pipfile. |
|  | --pipfile-lock | It will show only the Pipfile.lock. |
|  | --thoth-config | It will show only the .thoth.yaml. |
