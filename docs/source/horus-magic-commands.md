# Horus magic commands

As of `v0.10.0` jupyterlab-requirements supports `%horus` magic command directly in the cells so that the user can speed up all dependency management taks, working in one place. Magic commands are automatically loaded when you start a notebook and they automatically identify the notebook you are using.

To learn more about how to use the `%horus` magic commands check out the guide [here](https://github.com/thoth-station/jupyterlab-requirements#horus-magic-command) or the video [here](https://www.youtube.com/watch?v=FjVxNTXO70I)

<div style="text-align:center">
<img alt="JupyterLab Requirements Horus magic commands" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/JupyterLabRequirementsExtensionMC.png">
</div>

| magic-command | description |
| ------------- | ------------------ |
| %horus check | Check notebook metadata content about dependencies: `requirements`, `requirements_lock`, `dependency_resolution_engine`, `thoth_configuration_file` (only for Thoth resolution engine) |



## Create/Modify/Remove requirements in Pipfile in notebook metadata

You can add requirement to Pipfile in your notebook, using the following command:

```bash
%horus requirements --add tensorflow
```

If you want to remove a requirement instead, you can use the following command:

```bash
%horus requirements --remove tensorflow
```

## Lock requirements in notebook metadata and installed in the kernel

Adding `--kernel-name` can use a certain kernel name (default to `jupyterlab-requirements`).

Using `Thoth` resolution engine:

```bash
%horus lock
```

Thoth only can be combined with the commands below:

Adding `--set-timeout` will set timeout for request to thoth.

Adding `--force` will force request to thoth if one analysis result already exists.

Adding `--recommendation-type` the user can select the type of reccomendation:

- latest [default]
- stable
- performance
- security

Adding `--os-name` will use OS name in request to Thoth.

Adding `--os-version` will use OS version in request to Thoth.

Adding `--python-version` will use python version in request to Thoth.

Usign `Pipenv` resolution engine:

```bash
%horus lock --pipenv
```

Once dependencies are locked, they will be automatically installed in the kernel and saved in the notebook metadata.

## Convert notebook cells with pip commands to use horus commands in order to allow reproducibility

```
%horus convert
```

Have a look at this [video](https://www.youtube.com/watch?v=SFui8yrMVjw) to know more about this command.

## Discover notebook content about dependencies

This command is used to discover dependencies used in the notebook and create a Pipfile (empty if packages are not identified).
NOTE: Please keep in mind this feature is under development and the packages identified need to be checked by humans.

```bash
%horus discover
```

Adding `--force` will store file at the desired/default path even if one exists. If no `--force` is provided the CLI will simply fail.


## Extract notebook metadata content about dependencies

This command is used to extract dependencies content from notebook metadata and store it locally.

```
%horus extract
```

It can be combined with the commands below:

Adding `--store-files-path` will store file at the desired path.

Adding `--force` will store file at the desired/default path even if one exists. If no `--force` is provided the CLI will simply fail.

NOTE: Please keep in mind the `.thoth.yaml` will be stored at the root of the repo.

If you want to extract only a specific paramater, you can consider the following options:

```bash
%horus extract --pipfile
%horus extract --pipfile-lock
%horus extract --thoth-config
```