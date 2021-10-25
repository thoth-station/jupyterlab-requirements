# Jupyerlab requirements UI

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

The following table describes the parameters available in the UI before using the install button:

| parameter | description |
| ------------- | ------------------ |
| Kernel name | Select a name for the Jupyter Kernel where your dependencies will be installed. |
| Path root project | This is the path considered as root of your project (automatically discovered but customizable if necessary (e.g. when using overlays)). |
| Thoth Recommendation type | Recommendation type used when submitting request to Thoth resolution engine. |
| Thoth timeout | Assign timeout in seconds for the request to Thoth resolution engine. |
| Thoth force | `force` flag for the request to Thoth resolution engine in order to not consider cached results. |
| Thoth debug | `debug` flag for the request to Thoth resolution engine to run in debug/verbose mode (WARNING: This will impact the quality of the results). |


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

# jupyterlab-requirements UI API

[![Swagger Validator](https://img.shields.io/swagger/valid/3.0?specUrl=https%3A%2F%2Fraw.githubusercontent.com%2Fthoth-station%/jupyterlab-requirements%2Fmaster%jupyterlab_requirements%2Frest_api.yml)](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/jupyterlab_requirements/dependency_management/jupyterlab_requirements.yaml)
