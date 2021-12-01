"""jupyterlab-requirements setup."""
import os
import setuptools

from pathlib import Path

try:
    from jupyter_packaging import wrap_installers, npm_builder, get_data_files
except ImportError as e:
    import logging
    import sys

    logging.basicConfig(format="%(levelname)s: %(message)s")
    logging.warning("Build tool `jupyter-packaging` is missing. Install it with pip or conda.")
    if not ("--name" in sys.argv or "--version" in sys.argv):
        raise e

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
post_develop = npm_builder(build_cmd="install:extension", source_dir="src", build_dir=lab_path)
cmdclass = wrap_installers(post_develop=post_develop, ensured_targets=jstargets)

long_description: str = Path(HERE, "README.rst").read_text()


def _get_install_requires():
    with open("requirements.txt", "r") as requirements_file:
        res = requirements_file.readlines()
        return [req.split(" ", maxsplit=1)[0] for req in res if req]


setup_args = dict(
    name=name,
    entry_points={"console_scripts": ["horus=jupyterlab_requirements.cli:cli"]},
    version=version,
    url="https://github.com/thoth-station/jupyterlab-requirements",
    author="Francesco Murdaca",
    author_email="fmurdaca@redhat.com",
    description="JupyterLab Extension for dependency management and optimization",
    long_description=long_description,
    long_description_content_type="text/x-rst",
    cmdclass=cmdclass,
    data_files=get_data_files(data_files_spec),
    packages=setuptools.find_packages(),
    install_requires=_get_install_requires(),
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.8",
    project_urls={
        "Documentation": "https://github.com/thoth-station/jupyterlab-requirements/blob/master/README.md",
        "Source Code": "https://github.com/thoth-station/jupyterlab-requirements/",
        "Issues": "https://github.com/thoth-station/jupyterlab-requirements/issues",
        "Changelog": "https://github.com/thoth-station/jupyterlab-requirements/blob/master/CHANGELOG.md",
    },
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
