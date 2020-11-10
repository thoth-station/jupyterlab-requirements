"""
jupyterlab-requirements setup
"""
import json
import os

from pathlib import Path

from jupyter_packaging import (
    create_cmdclass, install_npm, ensure_targets,
    combine_commands, get_version,
)
import setuptools

HERE = os.path.abspath(os.path.dirname(__file__))

# The name of the project
name="jupyterlab-requirements"

# Get our version
with open(os.path.join(HERE, 'package.json')) as f:
    version = json.load(f)['version']

lab_path = os.path.join(HERE, name, "labextension")

# Representative files that should exist after a successful build
jstargets = [
    os.path.join(HERE, "lib", "index.js"),
    os.path.join(HERE, "package.json"),
]

package_data_spec = {
    name: [
        "*"
    ]
}

labext_name = "jupyterlab_requirements"

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, lab_path, "**"),
    ("share/jupyter/labextensions/%s" % labext_name, HERE, "install.json"),
]

cmdclass = create_cmdclass("jsdeps",
    package_data_spec=package_data_spec,
    data_files_spec=data_files_spec
)

cmdclass["jsdeps"] = combine_commands(
    install_npm(HERE, build_cmd="build:prod", npm=["jlpm"]),
    ensure_targets(jstargets),
)

README: str = Path(HERE, "README.md").read_text(encoding="utf-8")
REQUIREMENTS: list = Path(HERE, "requirements.txt").read_text().splitlines()

setup_args = dict(
    name=name,
    version=version,
    url="https://github.com/thoth-station/jupyterlab-requirements",
    author="Francesco Murdaca",
    author_email="fmurdaca@redhat.com",
    description="JupyterLab Extension for dependency management and optimization",
    long_description= README,
    long_description_content_type="text/markdown",
    cmdclass=cmdclass,
    packages=setuptools.find_packages(),
    install_requires=REQUIREMENTS,
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.6",
    license='GPLv3+',
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab"],
    classifiers=[
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Framework :: IPython",
        "Framework :: Jupyter",
        "Natural Language :: English",
        "Operating System :: OS Independent",
    ],
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
