"""jupyterlab-requirements setup."""
import os

from pathlib import Path

from jupyter_packaging import create_cmdclass, install_npm, ensure_targets, combine_commands
import setuptools

HERE = Path(__file__).parent.resolve()

# The name of the project
name = "jupyterlab_requirements"


# Get version
def _get_version(name):
    with open(os.path.join(name, "__init__.py")) as f:
        content = f.readlines()

    for line in content:
        if line.startswith("__version__ ="):
            # dirty, remove trailing and leading chars
            return line.split(" = ")[1][1:-2]
    raise ValueError("No version identifier found")


version = _get_version(name=name)

lab_path = os.path.join(HERE, name, "labextension")

# Representative files that should exist after a successful build
jstargets = [
    os.path.join(HERE, "lib", "index.js"),
    os.path.join(lab_path, "package.json"),
]

package_data_spec = {name: ["*"]}

# name of the labextension
labext_name = "jupyterlab_requirements"

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, str(lab_path), "**"),
    ("share/jupyter/labextensions/%s" % labext_name, str(HERE), "install.json"),
    ("etc/jupyter/jupyter_server_config.d", "jupyter-config/jupyter_server_config.d", "jupyterlab_requirements.json"),
    (
        "etc/jupyter/jupyter_notebook_config.d",
        "jupyter-config/jupyter_notebook_config.d",
        "jupyterlab_requirements.json",
    ),
]

# To deploy simultaneously the frontend and the backend,
# the frontend NPM package needs to be built and inserted in the Python package.
cmdclass = create_cmdclass("jsdeps", package_data_spec=package_data_spec, data_files_spec=data_files_spec)

cmdclass["jsdeps"] = combine_commands(
    # it will build the frontend NPM package
    install_npm(HERE, build_cmd="build:prod", npm=["jlpm"]),
    # It will copy the NPM package in the Python package
    # and force it to be copied in a place JupyterLab
    # is looking for frontend extensions when the Python package is installed.
    ensure_targets(jstargets),
)

README: str = Path(HERE, "README.md").read_text(encoding="utf-8")


def _get_install_requires():
    with open("requirements.txt", "r") as requirements_file:
        res = requirements_file.readlines()
        return [req.split(" ", maxsplit=1)[0] for req in res if req]


setup_args = dict(
    name=name,
    version=version,
    url="https://github.com/thoth-station/jupyterlab-requirements",
    author="Francesco Murdaca",
    author_email="fmurdaca@redhat.com",
    description="JupyterLab Extension for dependency management and optimization",
    long_description=README,
    long_description_content_type="text/markdown",
    cmdclass=cmdclass,
    packages=setuptools.find_packages(),
    install_requires=_get_install_requires(),
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.8",
    license="GPLv3+",
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab"],
    classifiers=[
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Framework :: IPython",
        "Framework :: Jupyter",
        "Natural Language :: English",
        "Operating System :: OS Independent",
    ],
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
