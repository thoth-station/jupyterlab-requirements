# jupyterlab-requirements

Dependency management and optimization in JupyterLab.

## About

This extension provides management of dependencies for JupyterLab notebooks.

The main goals of the project are the following:

* manage notebook requirements without leaving the notebook
* provide a unique and optimized* environment for each notebook

NOTE: The requirements are optimized using the [Thoth](https://thoth-station.ninja/) resolution engine

## Requirements

* JupyterLab >= 3.0

## Installation

```bash
pip install jupyterlab-requirements
```

```bash
pip install --upgrade jupyterlab jupyterlab-requirements
jupyter lab build
```

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Usage

Virtualenv created to run your notebook according to your requirements is created in:

`~/.local/share/thoth/kernels/{kernel_name}`

Current development efforts are focused on creating first UI.

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab-requirements directory
# Install package in development mode
pip install --use-feature=2020-resolver -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

jupyter serverextension enable --py jupyterlab-requirements --sys-prefix
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Uninstall

```bash
pip uninstall jupyterlab-requirements
```
