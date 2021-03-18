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

You can install this extension with pip:

```bash
pip install jupyterlab-requirements
```

And start using it immediately on JupyterLab:

```bash
jupyter lab
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

jupyter-nbrequirements extension for JupyterLab can be easily used from the notebook in JupyterLab.

### Extension Button

This jupyterlab extension provides a button directly in the notebook to manage the dependencies (see image below).

<div style="text-align:center">
<img alt="JupyterLab Requirements Extension" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/JupyterLabRequirementsExtension.jpg">
</div>

### Start adding dependencies from empty notebook

Clicking the above button you will receive the following dialog form initially:

<div style="text-align:center">
<img alt="Initial Dialog Form" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/InitialDialogForm.png">
</div>

Initially, no dependencies are identified if you start a new notebook as metadata related are not existing.
The extension checks in the notebook metadata in order to identify them every time you restart a notebook.
Moreover it verifies that the kernel you are using is matching your dependencies. If not it warns to use install button again to avoid weird behaviours.

You can start adding your packages using the central add button and once you select package name and version, remember to add your package using add button in action,
otherwise it won't be saved (in the future this behaviour will not be necessary due to the autocompletion feature):

<div style="text-align:center">
<img alt="Add Package" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/AddPackages.png">
</div>

NOTE: The extra button in action will be removed in the future.

NOTE: Autocompletion is planned in the future so that user can check which version are available on PyPI.

### Save dependencies added and install them in your customized kernel

After saving the install button will appear so you can check before actually installing the dependencies:

<div style="text-align:center">
<img alt="Install" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/Install.png">
</div>

NOTE: You can choose the name of the kernel you want for your notebook.

Using the Thoth resolution engine you can request an optimized software that satisfies your requirements using the Thoth recommender system.
You can choose the type of recommendation that better fits your needs:

* latest
* performance
* security
* stable
* testing

You can find more information and updates [here](https://thoth-station.ninja/recommendation-types/).

Finally after using the install button:

<div style="text-align:center">
<img alt="Ready to Work" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/ReadyToWork.png">
</div>

Now all dependencies will be locked (direct and transitive), saved in the notebook metadata, and installed. Moreover, the kernel will be automatically created and set for your notebook without human intervention required.

**Now you are ready to work on your project!**

### Restart notebook

If you restart notebook and check dependencies with button you will see that they are all installed and ready:

<div style="text-align:center">
<img alt="Restarting Notebook" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/RestartingNotebook.png">
</div>

### Start notebook without information about dependencies in metadata

If you have notebooks with code and you want to start using this extension, there is a nice feature that can be interesting.

Thoth relies on a library called [invectio](https://github.com/thoth-station/invectio). This library statically analyzes sources and extract information about called or exported library functions in Python applications.

jupyterlab-requirements extension uses this information to provide users with list of packages to be installed if they have never used the extension before.

<div style="text-align:center">
<img alt="User with code" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/UserwithCode.png">
</div>

## Resolution engines

* [Thoth](https://thoth-station.ninja/)

* [pipenv](https://github.com/pypa/pipenv)

Currently Thoth is used by default and pipenv is backup. In the future user will be able to select specific one.

## Virtual environment for you dependencies

Virtualenv created to run your notebook according to your dependencies requirement is created in:

`~/.local/share/thoth/kernels/{kernel_name}`

## Dependencies installation

Once lock file is created using any of available resolution engine. The dependencies are installed in the virtualenv using
[micropipenv](https://pypi.org/project/micropipenv/).

## Overlays directory

The dependencies stored in the notebook metadata are also stored into `overlays` folder (created automatically) using the kernel name by default.
If you want to know more about the use of overlays, have a look [here](https://github.com/thoth-station/thamos#support-for-multiple-runtime-environments).

## Thoth configuration file

Thoth resolution engine is able to provide an optimized software stack based on the runtime environment you are using (more inputs are used, if you want to know more, have a look here [here](https://github.com/thoth-station/adviser)).

In general different runtime environment will provide different effect on you application (e.g. more performance), therefore we include these information in the notebook metadata so that other can find out what runtime environment has been used to run a certain notebook.

# Contributing

## Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab-requirements directory
# Install package in development mode
pip install -ve .
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

# Uninstall

```bash
pip uninstall jupyterlab-requirements
```

# Demo development status and new features

* [v0.5.0](https://www.youtube.com/watch?v=A3W48aHubkE) [Mar 15 2021]

* [v0.3.7](https://www.youtube.com/watch?v=-_dtDAAyMlU&t) [Feb 10 2021]

* [v0.1.0](https://www.youtube.com/watch?v=IBzTOP4TCdA) [Dec 8 2020]
