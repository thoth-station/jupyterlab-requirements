JupyterLab Requirements
=======================

.. image:: https://img.shields.io/github/v/tag/thoth-station/jupyterlab-requirements?style=plastic
  :target: https://github.com/thoth-station/jupyterlab-requirements/releases
  :alt: GitHub tag (latest by date)

.. image:: https://img.shields.io/pypi/v/jupyterlab-requirements?style=plastic
  :target: https://pypi.org/project/jupyterlab-requirements
  :alt: PyPI - Module Version

.. image:: https://img.shields.io/pypi/l/jupyterlab-requirements?style=plastic
  :target: https://pypi.org/project/jupyterlab-requirements
  :alt: PyPI - License

.. image:: https://img.shields.io/pypi/dm/jupyterlab-requirements?style=plastic
  :target: https://pypi.org/project/jupyterlab-requirements
  :alt: PyPI - Downloads

This is a JupyterLab extension for dependency management and optimization and to foster reproducibility of Jupyter notebooks.

About
=====

This extension provides management of dependencies for JupyterLab notebooks.

The main goals of the project are the following:

* manage notebook requirements without leaving the notebook
* provide a unique and optimized* environment for each notebook

NOTE: *The requirements are optimized using the [Thoth](https://thoth-station.ninja/) resolution engine

Installation
============

This extension requires:

* JupyterLab >= 3.1.0

The extension can be installed via pip or Pipenv from `PyPI
<https://pypi.org/project/jupyterlab-requirements>`__:

.. code-block:: console

   pip install jupyterlab-requirements


You can initialize JupyterLab and start using it.

.. code-block:: console

   jupyter lab


Troubleshoot
------------

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

.. code-block:: console

   jupyter server extension list


If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

.. code-block:: console

   jupyter labextension list


Resolution engines
==================

There are currently two resolution engines available in the extension:

* [Thoth](https://thoth-station.ninja/)

* [Pipenv](https://github.com/pypa/pipenv)

NOTE: _Thoth is used by default and Pipenv can be triggered with flags or run as backup automatically._

NOTE: _Currently this extension supports only `Python` kernels._

Thoth
-----

Using the Thoth resolution engine you can request an optimized software stack that satisfies your requirements.

Thoth: recommendation type
--------------------------
--------------------------
   
You can choose the type of recommendation that better fits your needs:

* latest (default)
* performance
* security
* stable
* testing

You can find more information and updates [here](https://thoth-station.ninja/recommendation-types/).

Thoth: runtime environment
--------------------------
--------------------------

Thoth resolution engine is able to provide an optimized software stack based on the runtime environment you are using (more inputs are used, if you want to know more, have a look here [here](https://github.com/thoth-station/adviser)).

In general different runtime environment will provide different effect on you application (e.g. more performance), therefore we include these information in the notebook metadata so that other can find out what runtime environment has been used to run a certain notebook.

You can select the runtime environment to be used for the recommendation selecting:

*  Operating System Name

*  Operating System Version

* Python Interpreter Version

NOTE: _Those parameters are autodiscovered by the extension and assigned to your environment, you can customize them if you are interested._

Dependencies installation
-------------------------

Once lock file is created using any of available resolution engines, the dependencies will be installed in the virtualenv using
[micropipenv](https://pypi.org/project/micropipenv/).


Virtual environment for you dependencies
----------------------------------------

The virtual environment created and assigned to the kernel to be used for your notebook according to your dependencies requirements can be checked using the following command from a terminal:

.. code-block:: console

   cat ~/.local/share/thoth/kernels/{kernel_name}


Overlays directory
------------------

The dependencies stored in the notebook metadata can be also stored into `overlays` folder using the kernel name by default.
If you want to know more about the use of overlays, have a look [here](https://github.com/thoth-station/thamos#support-for-multiple-runtime-environments).
If you want to see a practical example on the use of overlays and how to create them from your notebook, you can check this [tutorial](https://github.com/AICoE/overlays-for-ai-pipeline-tutorial).


Delete kernels
--------------

If you have too many kernels, you can remove them directly from the JupyterLab menu under Kernel Section.
This plugin is provided from this extension.


Reproducibility
===============

You can use this extension for each of your notebook to guarantee they have the correct dependencies files required for reproducibility and shareability. In this way, all the dependencies information required to repeat the environment are shipped with the notebook.
In the notebook metadata you will find:

.. list-table::
   :widths: 25 40
   :header-rows: 1

   * - key
     - notes
   * - ``requirements``
     - All packages required (direct dependencies)
   * - ``requirements``
     - All packages (direct and transitive dependencies) locked with all hashes (Pipfile.lock)
   * - ``dependency resolution engine``
     - Currently two resolution engine are enabled: [Thoth](https://thoth-station.ninja/) and [Pipenv](https://github.com/pypa/pipenv)
   * - ``configuration file``
     - Only for Thoth resolution engine.

All this information can allow reproducibility of the notebook.


Usage
=====

There are 3 ways to interact with this extension:

- [%horus magic commands](./docs/source/horus-magic-commands.md) directly in your notebook's cells. 

- `horus CLI` directly from terminal or integrated in pipelines ([check video](https://www.youtube.com/watch?v=fW0YKugL26g&t)).

<div style="text-align:center">
<img alt="JupyterLab Requirements Horus CLI" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/JupyterLabRequirementsExtensionCLI.png">
</div>

- `jupyterlab-requirements UI` accessible through `Manage Dependencies` button that appears in the notebook when it is opened:

<div style="text-align:center">
<img alt="JupyterLab Requirements UI" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/JupyterLabRequirementsExtension.jpg">
</div>


# Extension Button

This jupyterlab extension provides a button directly in the notebook to manage the dependencies (see image below).

<div style="text-align:center">
<img alt="JupyterLab Requirements Extension" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/JupyterLabRequirementsExtension.jpg">
</div>

## How to use it

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

NOTE: _The extra button in action will be removed in the future._

NOTE: _Autocompletion is planned in the future so that user can check which version are available on PyPI._

### Save dependencies added and install them in your customized kernel

After saving the install button will appear so you can check before actually installing the dependencies:

<div style="text-align:center">
<img alt="Install" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/Install.png">
</div>

NOTE: You can choose the name of the kernel you want for your notebook.

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

# Horus: jupyterlab-requirements CLI

As of [v0.9.0](https://youtu.be/fW0YKugL26g) jupyterlab-requirements supports a CLI that can be used for automation processes, called `Horus`, another Egyptian God, part of Thoth family.

## Check notebook metadata content about dependencies

This command is used to verify if a certain notebook is reproducible, therefore if it contains all dependencies required for installation and run.
This command can be used in CI to verify notebooks have dependencies.

```
horus check [YOUR_NOTEBOOK].ipynb
```

## Show notebook metadata content about dependencies

This command is used to show dependencies content from notebook metadata.

```
horus show [YOUR_NOTEBOOK].ipynb
```

## Extract notebook metadata content about dependencies

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

## Install and create kernel for the notebook dependencies

This commands is used to prepare environment for the notebook to run, just pointing to the notebook.

```bash
horus set-kernel [YOUR_NOTEBOOK].ipynb
```

## Discover notebook content about dependencies

This command is used to discover dependencies used in the notebook and create a Pipfile (empty if packages are not identified).
NOTE: Please keep in mind this feature is under development and the packages identified need to be checked by humans.

```bash
horus discover [YOUR_NOTEBOOK].ipynb
```

Adding `--show-only` won't store file locally, but only show it to stdout.

Adding `--force` will store file at the desired/default path even if one exists. If no `--force` is provided the CLI will simply fail.

## Save content about dependencies in notebook metadata

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

## Create/Modify/Remove requirements in Pipfile in notebook metadata

You can add requirement to Pipfile in your notebook, using the following command:

```bash
horus requirements [YOUR_NOTEBOOK].ipynb  --add tensorflow
```

If you want to remove a requirement instead, you can use the following command:

```bash
horus requirements [YOUR_NOTEBOOK].ipynb  --remove tensorflow
```

## Lock requirements in notebook metadata

Adding `--kernel-name` can use a certain kernel name (default to `jupyterlab-requirements`).

Using Thoth resolution engine:

```bash
horus lock [YOUR_NOTEBOOK].ipynb
```

Thoth only can be combined with the commands below:

Adding `--set-timeout` will set timeout for request to thoth.

Adding `--force` will force request to thoth if one analysis result already exists.

Adding `--os-name` will use OS name in request to Thoth.

Adding `--os-version` will use OS version in request to Thoth.

Adding `--python-version` will use python version in request to Thoth.

Usign Pipenv resolution engine:

```bash
horus lock [YOUR_NOTEBOOK].ipynb  --pipenv
```

# jupyterlab-requirements API

[![Swagger Validator](https://img.shields.io/swagger/valid/3.0?specUrl=https%3A%2F%2Fraw.githubusercontent.com%2Fthoth-station%/jupyterlab-requirements%2Fmaster%jupyterlab_requirements%2Frest_api.yml)](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/jupyterlab_requirements/dependency_management/jupyterlab_requirements.yaml)


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

* [v0.11.0](https://www.youtube.com/watch?v=SFui8yrMVjw) [Sep 13 2021]

* [v0.10.4](https://www.youtube.com/watch?v=FjVxNTXO70I) [Aug 10 2021]

* [v0.9.2](https://www.youtube.com/watch?v=fW0YKugL26g&t) [Jul 19 2021]

* [v0.8.0](https://www.youtube.com/watch?v=DubjY5Ib4fA) [Jul 9 2021]

* [v0.7.4](https://www.youtube.com/watch?v=YQIhuB16DuM) [Jun 22 2021]

* [v0.5.0](https://www.youtube.com/watch?v=A3W48aHubkE) [Mar 15 2021]

* [v0.3.7](https://www.youtube.com/watch?v=-_dtDAAyMlU&t) [Feb 10 2021]

* [v0.1.0](https://www.youtube.com/watch?v=IBzTOP4TCdA) [Dec 8 2020]
