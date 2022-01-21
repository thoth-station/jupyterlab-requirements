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

This is a JupyterLab extension for dependency management and optimization created to guarantee reproducibility of Jupyter notebooks.

About
=====

This extension provides management of dependencies for JupyterLab notebooks.

The main goals of the project are the following:

* manage notebook requirements without leaving the notebook
* provide a unique and optimized environment for each notebook

NOTE: The requirements are optimized using the `Thoth <https://thoth-station.ninja/>`__ resolution engine.

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

Usage
=====

There are 3 ways to interact with this extension:

- `%horus magic commands <https://github.com/thoth-station/jupyterlab-requirements/blob/master/docs/source/horus-magic-commands.md>`__ directly in your notebook's cells.

- `horus CLI <https://github.com/thoth-station/jupyterlab-requirements/blob/master/docs/source/horus-cli.md>`__ from terminal or integrated in pipelines.

- `jupyterlab-requirements UI <https://github.com/thoth-station/jupyterlab-requirements/blob/master/docs/source/jupyterlab-requirements-ui.md>`__ accessible through `Manage Dependencies` button that appears in the notebook when it is opened in JupyteLab.


Resolution engines
==================

There are currently two resolution engines available in the extension:

* `Thoth <https://thoth-station.ninja/>`__

* `Pipenv <https://github.com/pypa/pipenv>`__

NOTE: Thoth is used by default and Pipenv can be triggered with flags or run as backup automatically.

NOTE: Currently this extension supports only `Python` kernels.

Thoth
-----

Using the Thoth resolution engine you can request an optimized software stack that satisfies your requirements.

Thoth: recommendation type
--------------------------

You can choose the type of recommendation that better fits your needs:

* latest (default)
* performance
* security
* stable
* testing

You can find more information and updates `here <https://thoth-station.ninja/recommendation-types/>`__.

Thoth: runtime environment
--------------------------

Thoth resolution engine is able to provide an optimized software stack based on the runtime environment you are using (several inputs are used, if you want to know more, have a look here `here <https://github.com/thoth-station/adviser>`__).

In general different runtime environment will provide different effect on you application (e.g. more performance), therefore we include these information in the notebook metadata so that other can find out what runtime environment has been used to run a certain notebook.

You can select the runtime environment to be used for the recommendation selecting:

*  Operating System Name

*  Operating System Version

* Python Interpreter Version

NOTE: Those parameters are autodiscovered by the extension and assigned to your environment, you can customize them if you are interested.

Dependencies installation
=========================

Once lock file is created using any of available resolution engines, the dependencies will be installed in the virtualenv using
`micropipenv <https://pypi.org/project/micropipenv/>`__.


Virtual environment for you dependencies
========================================

The virtual environment created and assigned to the kernel to be used for your notebook according to your dependencies requirements can be checked using the following command from a terminal:

.. code-block:: console

   cat ~/.local/share/thoth/kernels/{kernel_name}


Overlays directory
==================

The dependencies stored in the notebook metadata can be also stored into `overlays` folder using the kernel name by default.
If you want to know more about the use of overlays, have a look `micropipenv <https://github.com/thoth-station/thamos#support-for-multiple-runtime-environments>`__.
If you want to see a practical example on the use of overlays and how to create them from your notebook, you can check this `tutorial <https://github.com/AICoE/overlays-for-ai-pipeline-tutorial>`__.


Delete kernels
==============

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
     - All packages required (direct dependencies).
   * - ``requirements``
     - All packages (direct and transitive dependencies) locked with all hashes (Pipfile.lock).
   * - ``dependency resolution engine``
     - Currently two resolution engine are enabled.
   * - ``configuration file``
     - Only for Thoth resolution engine.

All this information can allow reproducibility of the notebook.

Contributing
============

Development install
-------------------

NOTE: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
`yarn <https://yarnpkg.com/>`__ that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

1. Fork this repository

2. Clone the origin repo to your local environment

.. code-block:: console

   git clone git@github.com:thoth-station/jupyterlab-requirements.git

3. Change directory to the jupyterlab-requirements directory

4. Create new virtualenv

.. code-block:: console

   pipenv install --dev

5. Enter environment.

.. code-block:: console

   pipenv shell


All following commands needs to be run from the virtualenv created and accessed with command in point 5.

6. Install package in development mode

.. code-block:: console

   pip install -ve . --no-cache-dir


7. Link your development version of the extension with JupyterLab

.. code-block:: console

   jupyter labextension develop . --overwrite

.. code-block:: console

   jupyter serverextension enable --py jupyterlab-requirements --sys-prefix


8. Rebuild extension Typescript source after making changes

.. code-block:: console

   jlpm run build


You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

The following command watch the source directory in one terminal, automatically rebuilding when needed.

.. code-block:: console

   jlpm run watch

The following command run JupyterLab in another terminal.

.. code-block:: console

   jupyter lab


With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

.. code-block:: console

   jupyter lab build --minimize=False


9. Run tests using the command

.. code-block:: console

   python3 setup.py test


When all tests passed and you are ready with a new contribution open a Pull Request!! We are very happy to receive contributions from the community!


Demo development status and new features
========================================

* `v0.13.0 <https://www.youtube.com/watch?v=7BuxODwRKq8>`__ [Nov 22 2021]

* `v0.11.0 <https://www.youtube.com/watch?v=SFui8yrMVjw>`__ [Sep 13 2021]

* `v0.10.4 <https://www.youtube.com/watch?v=FjVxNTXO70I>`__ [Aug 10 2021]

* `v0.9.2 <https://www.youtube.com/watch?v=fW0YKugL26g&t>`__ [Jul 19 2021]

* `v0.8.0 <https://www.youtube.com/watch?v=DubjY5Ib4fA>`__ [Jul 9 2021]

* `v0.7.4 <https://www.youtube.com/watch?v=YQIhuB16DuM>`__ [Jun 22 2021]

* `v0.5.0 <https://www.youtube.com/watch?v=A3W48aHubkE>`__ [Mar 15 2021]

* `v0.3.7 <https://www.youtube.com/watch?v=-_dtDAAyMlU&t>`__ [Feb 10 2021]

* `v0.1.0 <https://www.youtube.com/watch?v=IBzTOP4TCdA>`__ [Dec 8 2020]


Uninstall
=========

.. code-block:: console

   pip uninstall jupyterlab-requirements
