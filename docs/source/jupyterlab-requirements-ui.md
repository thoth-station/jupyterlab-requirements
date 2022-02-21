# Jupyerlab requirements UI

This jupyterlab extension provides a button directly in the notebook to manage the dependencies (see image below).

<div style="text-align:center">
<img alt="JupyterLab Requirements Extension" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/JupyterLabRequirementsExtension.jpg">
</div>

NOTE: jupyterlab-requirements UI has a Python backend and Javascript frontend logic. Python backend relies on [thamos](https://github.com/thoth-station/thamos) library (CLI and library for interacting with Thoth services) to work specifically with jupyter notebooks.

## How to use it

### Start adding dependencies from empty notebook

Clicking the above button you will receive the following dialog form initially:

<div style="text-align:center">
<img alt="Initial Dialog Form" src="https://raw.githubusercontent.com/thoth-station/jupyterlab-requirements/master/docs/images/InitialDialogForm.png">
</div>

Initially, no dependencies are identified if you start a new notebook as metadata related are not existing.
The extension checks in the notebook metadata in order to identify them every time you restart a notebook.
Moreover it verifies that the kernel you are using is matching your dependencies. If not it warns to use install button again to avoid weird behaviours.

You can start adding your packages using the central add button, which will open a new package row to edit.
1. First type out a package. For packages that are avialable in PyPI, an informational popup will be shown to indicate that it is a valid package.
2. Then choose a constraint. If the package is both valid and known by Thoth, clicking the dialog box will open a dropdown (explained in detail below). If the package is not known by Thoth, then you will have to manually type the constraints.
3. Once you have selected the package name and constraints, remember to add your package using the add button under the actions column, otherwise it won't be saved. (_This extra step will be removed in a later release._)

The constraint dropdown must be opened after a package name is given. Any changes to the package name will reset the constraints without warning.

![ezgif com-gif-maker](https://user-images.githubusercontent.com/12587674/154281326-7b392e03-5d99-4b95-b44b-42653fa7f375.gif)

There are two sections in the constraints dropdown: the selected packages and the package list. The selected package's constraints can be customized to fit any specification. Use the the selector dropdown (==, >, <, !=, ...) in combination with the `*` selector to formulate your constraint.

![version_dropdown](https://user-images.githubusercontent.com/12587674/154273898-66ea7873-3444-432c-bc13-e71c9e40e733.png)

| number | component | description |
| ------------- | ------------------ | ------------------ |
| 1 | Version result text | The resulting version constraints use in the package resolver. |
| 2 | Constraint picker | A dropdown menu of the types of constraints that can be used with the version on its right. Notice the parallel between component `1` and selected constraints in `2`. |
| 3 | Version filter | You can toggle any of the numbers in the version to convert it to a `*`. ex) `1.4.0rc0` -> `1.4.*`  |
| 4 | Version text | This is a the version that is selected below in the version list (`7`). |
| 5 | Done button | This saves your selection and closes the form. |
| 6 | Reset / Cancel button | This resets the result text back to `*` |
| 7 | Version selectors | You can add or remove any version from the selection. A selected version is defaulted to `==*` but can be customized with `2`,`3`, and `4` |

### Save dependencies added and install them in your customized kernel

After saving the install button will appear so you can check before actually installing the dependencies:

<div style="text-align:center">
<img alt="Install" src="https://user-images.githubusercontent.com/12587674/154145147-c6ad1b6a-336c-4922-95b1-5fc276b7f3a8.png">
</div>

The following table describes the parameters available in the UI before using the install button:

| parameter | description |
| ------------- | ------------------ |
| Kernel name | Select a name for the Jupyter Kernel where your dependencies will be installed. |
| Path root project | This is the path considered as root of your project (automatically discovered but customizable if necessary (e.g. when using overlays)). |
| Thoth Recommendation type | Recommendation type used when submitting request to Thoth resolution engine. |
| Thoth Python version | Python version used when submitting request to Thoth resolution engine. |
| Thoth OS name | Operating System name used when submitting request to Thoth resolution engine. |
| Thoth OS version | Operating System version used when submitting request to Thoth resolution engine. |
| Thoth timeout | Assign timeout in seconds for the request to Thoth resolution engine. |
| Thoth force | `force` flag for the request to Thoth resolution engine in order to not consider cached results. |
| Thoth debug | `debug` flag for the request to Thoth resolution engine to run in debug/verbose mode (WARNING: This will impact the quality of the results). |
| Thoth labels | `labels` used when submitting request to Thoth resolution engine. |


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
