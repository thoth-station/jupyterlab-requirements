# Horus: jupyterlab-requirements CLI

As of [v0.9.0](https://youtu.be/fW0YKugL26g) jupyterlab-requirements supports a CLI that can be used for automation processes, called `Horus`, another Egyptian God, part of Thoth family.

<div style="text-align:center">
<img alt="JupyterLab Requirements Horus CLI" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/JupyterLabRequirementsExtensionCLI.png">
</div>

NOTE: horus CLI is an extension of [thamos](https://github.com/thoth-station/thamos) library (CLI and library for interacting with Thoth services) to work specifically with jupyter notebooks.

## check

This command is used to verify if a certain notebook is reproducible, therefore if it contains all dependencies required for installation and run.
This command can be used in CI to verify notebooks have dependencies.

```
horus check [YOUR_NOTEBOOK].ipynb
```

## discover

This command is used to discover dependencies used in the notebook and create a Pipfile (empty if packages are not identified).
NOTE: Please keep in mind this feature is under development and the packages identified need to be checked by humans.

```bash
horus discover [YOUR_NOTEBOOK].ipynb
```

Adding `--show-only` won't store file locally, but only show it to stdout.

Adding `--force` will store file at the desired/default path even if one exists. If no `--force` is provided the CLI will simply fail.

## extract

This command is used to extract dependencies content from notebook metadata and store it locally.

```
horus extract [YOUR_NOTEBOOK].ipynb
```

It can be combined with the commands below:

Adding `--store-files-path` will store file at the desired path.

Adding `--force` will store file at the desired/default path even if one exists. If no `--force` is provided the CLI will simply fail.

NOTE: Please keep in mind the `.thoth.yaml` will be stored at the root of the repo.

If you want to extract only a specific paramater, you can consider the following options:

```bash
horus extract [YOUR_NOTEBOOK].ipynb  --pipfile
horus extract [YOUR_NOTEBOOK].ipynb  --pipfile-lock
horus extract [YOUR_NOTEBOOK].ipynb  --thoth-config
```

## log

This command is used to see logs from Thoth analysis ID resolution process (only if Thoth resolution engine was used).

## lock

This command is used to create kernel, lock requirements, intall them and save them in the notebook metadata.

Adding `--kernel-name` can use a certain kernel name (default to `jupyterlab-requirements`).

Using Thoth resolution engine:

```bash
horus lock [YOUR_NOTEBOOK].ipynb
```

Thoth only can be combined with the commands below:

Adding `--set-timeout` will set timeout for request to thoth.

Adding `--force` will force the request to thoth if one analysis result already exists.

Adding `--debug` will enable debug/verbose request to thoth. NOTE: It has an impact on the quality of the resolution process.

Adding `--os-name` will use OS name in the request to Thoth.

Adding `--os-version` will use OS version in the request to Thoth.

Adding `--python-version` will use python version in the request to Thoth.

Adding `--labels` will add labels (e.g. KEY1=VALUE1,KEY2=VALUE2) in the request to Thoth.

Usign Pipenv resolution engine:

```bash
horus lock [YOUR_NOTEBOOK].ipynb  --pipenv
```

## requirements

This comand is used to create, update or remove requirements from Pipfile in notebook metadata.

You can add requirement to Pipfile in your notebook, using the following command:

```bash
horus requirements [YOUR_NOTEBOOK].ipynb  --add tensorflow
```

If you want to remove a requirement instead, you can use the following command:

```bash
horus requirements [YOUR_NOTEBOOK].ipynb  --remove tensorflow
```

## save

This command is used to save content in notebook metadata.

```
horus save [YOUR_NOTEBOOK].ipynb --resolution-engine [RESOLUTION_ENGINE]
```

RESOLUTION_ENGINE can be `thoth` or `pipenv` currently.

It can be combined with the commands below:

Adding `--save-files-path` will consider files to save from the desired path.

Adding `--force` will store file at the desired/default path even if one exists. If no `--force` is provided the CLI will simply fail.

Adding `--kernel-name` can set a certain kernel name (default to `jupyterlab-requirements`).

If you want to save only a specific paramater, you can consider the following options:

```bash
horus save [YOUR_NOTEBOOK].ipynb  --pipfile
horus save [YOUR_NOTEBOOK].ipynb  --pipfile-lock
horus save [YOUR_NOTEBOOK].ipynb  --thoth-config
```

## set-kernel

This commands is used to prepare environment for the notebook to run (create kernel and install dependencies from notebook metadata), just pointing to the notebook.

```bash
horus set-kernel [YOUR_NOTEBOOK].ipynb
```

## show

This command is used to show dependencies content from notebook metadata.

```
horus show [YOUR_NOTEBOOK].ipynb
```

If you want to show only a specific paramater, you can consider the following options:

```bash
horus show [YOUR_NOTEBOOK].ipynb  --pipfile
horus show [YOUR_NOTEBOOK].ipynb  --pipfile-lock
horus show [YOUR_NOTEBOOK].ipynb  --thoth-config
```


## kernel specific commands

### check-kernel

This command is used to check what packages are available in the kernel (pip list output).

```
horus check-kernel
```

### delete-kernel

This command is used to delete kernel created with horus.

```
horus delete-kernel
```

### list-kernels

This command is used to list kernels available (jupyter kernelspec list).

```
horus list-kernels
```
