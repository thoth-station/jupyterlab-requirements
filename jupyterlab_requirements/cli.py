#!/usr/bin/env python3
# thoth-jupyterlab-requirements
# Copyright(C) 2021 Francesco Murdaca
#
# This program is free software: you can redistribute it and / or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

"""A CLI for jupyterlab-requirements."""

import logging
import os
import json
import ast
import sys
import subprocess
import yaml
import click
import invectio
import distutils

from typing import Optional
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.text import Text

from thoth.python import Pipfile, PipfileLock, PipfileMeta
from thoth.python import Source, PackageVersion
from thoth.python import Project
from thamos.config import _Configuration
from thamos.discover import discover_python_version

from dependency_management import install_packages
from dependency_management import create_kernel
from dependency_management import delete_kernel
from dependency_management import load_files


_LOGGER = logging.getLogger("thoth.jupyterlab_requirements.cli")


_EMOJI = {
    "WARNING": Text("\u26a0\ufe0f WARNING", style="yellow"),
    "ERROR": Text("\u274c ERROR", style="bold red"),
    "INFO": Text("\u2714\ufe0f INFO", "green"),
}


def _get_version(name):
    """Print jupyterlab-requirements version and exit."""
    with open(os.path.join(name, "__init__.py")) as f:
        content = f.readlines()

    for line in content:
        if line.startswith("__version__ ="):
            # dirty, remove trailing and leading chars
            return line.split(" = ")[1][1:-2]

    raise ValueError("No version identifier found")


def _print_version(ctx: click.Context, _, value: str):
    """Print version and exit."""
    if not value or ctx.resilient_parsing:
        return

    click.echo(_get_version(name="jupyterlab_requirements"))
    ctx.exit()


@click.group()
@click.pass_context
@click.option(
    "-v",
    "--verbose",
    is_flag=True,
    envvar="THOTH_JUPYTERLAB_REQUIREMENTS_DEBUG",
    help="Be verbose about what's going on.",
)
@click.option(
    "--version",
    is_flag=True,
    is_eager=True,
    callback=_print_version,
    expose_value=False,
    help="Print version and exit.",
)
def cli(
    ctx=None,
    verbose: bool = False,
    output: Optional[str] = None,
):
    """CLI tool for jupyterlab-requirements."""
    if verbose:
        _LOGGER.setLevel(logging.DEBUG)

    _LOGGER.debug("Debug mode is on")
    _LOGGER.info("Version: %s", _get_version(name="jupyterlab_requirements"))


def get_notebook_content(notebook_path: str):
    """Get JSON of the notebook content."""
    actual_path = Path(notebook_path)

    if not actual_path.exists():
        raise FileNotFoundError(f"There is no file at this path: {actual_path.as_posix()!r}")

    if actual_path.suffix != ".ipynb":
        raise Exception("File submitted is not .ipynb")

    with open(notebook_path) as notebook_content:
        notebook = json.load(notebook_content)

    return notebook


@cli.command("extract")
@click.pass_context
@click.argument("path")
@click.option(
    "--store-files-path",
    is_flag=False,
    default=".",
    help="Custom path used to store all files.",
)
@click.option(
    "--pipfile",
    is_flag=True,
    help="Extract and store Pipfile.",
)
@click.option(
    "--pipfile-lock",
    is_flag=True,
    help="Extract and store Pipfile.lock.",
)
@click.option(
    "--thoth-config",
    is_flag=True,
    help="Extract and store .thoth.yaml.",
)
@click.option(
    "--use-overlay",
    is_flag=True,
    help="Extract Pipfile and Pipfile.lock in overlay with kernel name.",
)
@click.option(
    "--extract-all",
    is_flag=True,
    help="Extract and store all content from metadata.",
)
@click.option(
    "--show-only",
    is_flag=True,
    help="If active only the content will be shown but not extracted.",
)
@click.option(
    "--force",
    is_flag=True,
    help="Force actions for extraction.",
)
def extract(
    ctx: click.Context,
    path: str,
    store_files_path: str,
    pipfile: bool = False,
    pipfile_lock: bool = False,
    thoth_config: bool = False,
    use_overlay: bool = False,
    show_only: bool = False,
    force: bool = False,
    extract_all: bool = False,
):
    """Extract dependencies from notebook metadata.

    Examples:
        jupyterlab-requirements-cli extract [YOUR_NOTEBOOK].ipynb  --pipfile
        jupyterlab-requirements-cli extract [YOUR_NOTEBOOK].ipynb  --pipfile-lock
        jupyterlab-requirements-cli extract [YOUR_NOTEBOOK].ipynb  --thoth-config
    """
    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = notebook.get("metadata")

    language_info = notebook_metadata.get("language_info")
    language = language_info.get("name")

    if language != "python":
        raise Exception("Only Python kernels are currently supported.")

    kernelspec = notebook_metadata.get("kernelspec")
    kernel_name = kernelspec.get("name")
    click.echo(f"Kernel name is: {kernel_name!s}")

    if not show_only:
        store_path: Path = Path(store_files_path)

    if use_overlay and not show_only:
        if not kernel_name:
            raise KeyError("No kernel name identified in notebook metadata kernelspec.")

        store_path = store_path.joinpath("overlays").joinpath(kernel_name)
        store_path.mkdir(parents=True, exist_ok=True)

    dependency_resolution_engine = notebook_metadata.get("dependency_resolution_engine")

    if not dependency_resolution_engine:
        raise KeyError("No Resolution engine identified in notebook metadata.")

    click.echo(f"Resolution engine identified: {dependency_resolution_engine!s}")

    if pipfile or extract_all:
        pipfile_string = notebook_metadata.get("requirements")

        if not pipfile_string:
            raise KeyError("No Pipfile identified in notebook metadata.")

        pipfile_ = Pipfile.from_string(pipfile_string)

        if show_only:
            click.echo(f"\nPipfile:\n\n{pipfile_.to_string()}")

            if not extract_all:
                ctx.exit(0)
        else:
            pipfile_path = store_path.joinpath("Pipfile")

            if pipfile_path.exists() and not force:
                raise FileExistsError(
                    f"Cannot store Pipfile because it already exists at path: {pipfile_path.as_posix()!r}"
                )
            else:
                pipfile_.to_file(path=pipfile_path)

    if pipfile_lock or extract_all:
        pipfile_lock_string = notebook_metadata.get("requirements_lock")

        if not pipfile_lock_string:
            raise KeyError("No Pipfile.lock identified in notebook metadata.")

        pipfile_lock_ = PipfileLock.from_string(pipfile_content=pipfile_lock_string, pipfile=Pipfile.from_string(""))

        if show_only:
            click.echo(f"\nPipfile.lock:\n\n{pipfile_lock_.to_string()}")

            if not extract_all:
                ctx.exit(0)
        else:
            pipfile_lock_path = store_path.joinpath("Pipfile.lock")

            if pipfile_lock_path.exists() and not force:
                raise FileExistsError(
                    f"Cannot store Pipfile.lock because it already exists at path: {pipfile_lock_path.as_posix()!r}"
                )
            else:
                pipfile_lock_.to_file(path=pipfile_lock_path)

    if thoth_config or extract_all:
        thoth_config_string = notebook_metadata.get("thoth_config")

        if not thoth_config_string:
            raise KeyError("No .thoth.yaml identified in notebook metadata.")

        config = _Configuration()
        config.load_config_from_string(thoth_config_string)
        if show_only:
            click.echo(f"\n.thoth.yaml:\n\n{config.content}")

            if not extract_all:
                ctx.exit(0)
        else:
            yaml_path = Path(".thoth.yaml")
            if yaml_path.exists() and not force:
                raise FileExistsError(
                    f"Cannot store .thoth.yaml because it already exists at path: {yaml_path.as_posix()!r}"
                )
            else:
                config.save_config()

    ctx.exit(0)


def save_notebook_content(notebook_path: str, notebook: dict):
    """Save notebook content."""
    with open(notebook_path, "w") as notebook_content:
        json.dump(notebook, notebook_content)

    return notebook


@cli.command("save")
@click.pass_context
@click.argument("path")
@click.option(
    "--resolution-engine",
    is_flag=False,
    type=click.Choice(["thoth", "pipenv"], case_sensitive=False),
    required=True,
    help="Resolution engine used to lock dependencies.",
)
@click.option(
    "--save-files-path",
    is_flag=False,
    default=".",
    type=str,
    help="Custom path used to identify dependencies files.",
)
@click.option(
    "--pipfile",
    is_flag=True,
    help="Save Pipfile in notebook metadata.",
)
@click.option(
    "--pipfile-lock",
    is_flag=True,
    help="Save Pipfile.lock. in notebook metadata.",
)
@click.option(
    "--thoth-config",
    is_flag=True,
    help="Save .thoth.yaml in notebook metadata.",
)
@click.option(
    "--save-all",
    is_flag=False,
    type=str,
    default=".",
    show_default=True,
    help="Save all content from metadata.",
)
@click.option(
    "--force",
    is_flag=True,
    help="Force save if content for dependencies already exists.",
)
@click.option(
    "--kernel-name",
    is_flag=False,
    type=str,
    default="jupyterlab-requirements",
    show_default=True,
    help="Name of kernel.",
)
def save(
    ctx: click.Context,
    path: str,
    resolution_engine: str,
    save_files_path: str,
    save_all: str,
    kernel_name: str,
    pipfile: bool = False,
    pipfile_lock: bool = False,
    thoth_config: bool = False,
    force: bool = False,
):
    """Save dependencies in notebook metadata.

    Examples:
        jupyterlab-requirements-cli save [YOUR_NOTEBOOK].ipynb  --pipfile
        jupyterlab-requirements-cli save [YOUR_NOTEBOOK].ipynb  --pipfile-lock
        jupyterlab-requirements-cli save [YOUR_NOTEBOOK].ipynb  --thoth-config
    """
    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = dict(notebook.get("metadata"))

    language_info = notebook_metadata.get("language_info")
    language = language_info.get("name")

    if language != "python":
        raise Exception("Only Python kernels are currently supported.")

    click.echo(f"Resolution engine set to {resolution_engine}.")

    pipfile_string, pipfile_lock_string = load_files(base_path=save_files_path)

    if pipfile or save_all:
        if "requirements" in notebook_metadata and not force:
            raise FileExistsError("Cannot store Pipfile in notebook metadata because it already exists.")
        else:
            if not force:
                click.echo("No requirements found in notebook metadata.")
            else:
                click.echo("Updating existing requirements in notebook metadata.")

            notebook_metadata["requirements"] = pipfile_string

    if pipfile_lock_string or save_all:
        if "requirements_lock" in notebook_metadata and not force:
            raise FileExistsError("Cannot store Pipfile.lock in notebook metadata because it already exists.")
        else:
            if not force:
                click.echo("No requirements_lock found in notebook metadata.")
            else:
                click.echo("Updating existing requirements_lock in notebook metadata.")

            notebook_metadata["requirements_lock"] = pipfile_lock_string

    if resolution_engine == "thoth":
        config = _Configuration()
        config.load_config_from_file(config_path=Path(save_files_path).joinpath(".thoth.yaml"))

        if thoth_config or save_all:
            if "thoth_config" in notebook_metadata and not force:
                raise FileExistsError("Cannot store .thoth.yaml in notebook metadata because it already exists.")
            else:
                if not force:
                    click.echo("No .thoth.yaml found in notebook metadata.")
                else:
                    click.echo("Updating existing .thoth.yaml in notebook metadata.")

                notebook_metadata["thoth_config"] = json.dumps(config.content)

    if kernel_name:
        notebook_metadata["kernelspec"]["name"] = kernel_name

    notebook_metadata["dependency_resolution_engine"] = resolution_engine

    notebook["metadata"] = notebook_metadata

    save_notebook_content(notebook_path=path, notebook=notebook)
    ctx.exit(0)


def _gather_libraries(notebook_path: str):
    """Gather libraries with invectio."""
    actual_path = Path(notebook_path)

    if not actual_path.exists():
        raise FileNotFoundError(f"There is no file at this path: {actual_path.as_posix()!r}")

    if actual_path.suffix != ".ipynb":
        raise Exception("File submitted is not .ipynb")

    check_convert = subprocess.run(
        f"jupyter nbconvert --to script {actual_path} --stdout", shell=True, capture_output=True
    )

    if check_convert.returncode != 0:
        raise Exception("jupyter nbconvert failed converting notebook to .py")

    notebook_content = check_convert.stdout.decode("utf-8")

    try:
        tree = ast.parse(notebook_content)
    except Exception:
        raise

    visitor = invectio.lib.InvectioLibraryUsageVisitor()
    visitor.visit(tree)

    report = visitor.get_module_report()

    std_lib_path = Path(distutils.sysconfig.get_python_lib(standard_lib=True))
    std_lib = {p.name.rstrip(".py") for p in std_lib_path.iterdir()}

    libs = filter(lambda k: k not in std_lib | set(sys.builtin_module_names), report)
    library_gathered = list(libs)

    return library_gathered


def create_pipfile_from_packages(packages: list):
    """Create Pipfile from list of packages."""
    source = Source(url="https://pypi.org/simple", name="pypi", verify_ssl=True)

    pipfile_meta = PipfileMeta(sources={"pypi": source}, requires={"python_version": discover_python_version()})

    packages_versions = []

    for package_name in packages:
        package_version = PackageVersion(name=package_name, version="*", develop=False)
        packages_versions.append(package_version)

    pipfile_ = Pipfile.from_package_versions(packages=packages_versions, meta=pipfile_meta)

    return pipfile_


@cli.command("discover")
@click.pass_context
@click.argument("path")
@click.option(
    "--store-files-path",
    is_flag=False,
    default=".",
    help="Custom path used to store all files.",
)
@click.option(
    "--show-only",
    is_flag=True,
    help="If active only the content will be shown but no Pipfile created.",
)
@click.option(
    "--force",
    is_flag=True,
    help="Force actions for creation of Pipfile.",
)
def discover(ctx: click.Context, path: str, store_files_path: str, show_only: bool = False, force: bool = False):
    """Discover dependencies from notebook content.

    Examples:
        jupyterlab-requirements-cli discover [YOUR_NOTEBOOK].ipynb

        jupyterlab-requirements-cli discover [YOUR_NOTEBOOK].ipynb --only-show
    """
    packages = _gather_libraries(notebook_path=path)

    if packages:
        click.echo(f"Thoth invectio libraries gathered: {json.dumps(packages)}")
    else:
        click.echo(f"No libraries discovered from notebook at path: {path}")

    pipfile = create_pipfile_from_packages(packages=packages)

    if show_only:
        click.echo(f"\nPipfile:\n\n{pipfile.to_string()}")
        ctx.exit(0)
    else:
        store_path: Path = Path(store_files_path)

        pipfile_path = store_path.joinpath("Pipfile")

        if pipfile_path.exists() and not force:
            raise FileExistsError(
                f"Cannot store Pipfile because it already exists at path: {pipfile_path.as_posix()!r}"
            )
        else:
            pipfile.to_file(path=pipfile_path)

    ctx.exit(0)


def check_metadata_content(notebook_metadata: dict) -> list:
    """Check the metadata of notebook for dependencies."""
    result = []

    language_info = notebook_metadata.get("language_info")
    language = language_info.get("name")

    if language != "python":
        result.append(
            {
                "message": "Only python programming language is supported.",
                "type": "ERROR",
            }
        )

        return result

    kernelspec = notebook_metadata.get("kernelspec")
    kernel_name = kernelspec.get("name")

    result.append(
        {
            "message": f"kernel name: {kernel_name}",
            "type": "INFO",
        }
    )

    for mandatory_key in ["dependency_resolution_engine", "requirements", "requirements_lock"]:
        if mandatory_key not in notebook_metadata.keys():
            result.append(
                {
                    "message": f"{mandatory_key} key is not present in notebook metadata",
                    "type": "ERROR",
                }
            )
        else:
            result.append(
                {
                    "message": f"{mandatory_key} key is present in notebook metadata",
                    "type": "INFO",
                }
            )

    if "requirements" in notebook_metadata and "requirements_lock" in notebook_metadata:
        project = Project.from_strings(
            pipfile_str=notebook_metadata["requirements"], pipfile_lock_str=notebook_metadata["requirements_lock"]
        )

        if project.pipfile_lock.meta.hash["sha256"] != project.pipfile.hash()["sha256"]:
            result.append(
                {
                    "message": f"Pipfile hash stated in Pipfile.lock {project.pipfile_lock.meta.hash['sha256'][:6]} "
                    f"does not correspond to Pipfile hash {project.pipfile.hash()['sha256'][:6]} - was Pipfile "
                    "adjusted? This error is not critical.",
                    "type": "ERROR",
                }
            )
        else:
            result.append(
                {
                    "message": f"Pipfile hash stated in Pipfile.lock {project.pipfile_lock.meta.hash['sha256'][:6]} "
                    f"correspond to Pipfile hash {project.pipfile.hash()['sha256'][:6]}.",
                    "type": "INFO",
                }
            )

    resolution_engine = notebook_metadata.get("dependency_resolution_engine")

    if not resolution_engine:
        return result

    result.append(
        {
            "message": f"Notebook dependencies are created with {resolution_engine} resolution engine",
            "type": "INFO",
        }
    )

    if resolution_engine == "thoth":
        for thoth_specific_key in ["thoth_config"]:
            if thoth_specific_key not in notebook_metadata.keys():
                result.append(
                    {
                        "message": f"{thoth_specific_key} key is not present in notebook metadata",
                        "type": "ERROR",
                    }
                )
            else:
                result.append(
                    {
                        "message": f"{thoth_specific_key} key is present in notebook metadata",
                        "type": "INFO",
                    }
                )

    return result


@cli.command("check")
@click.pass_context
@click.argument("path")
@click.option(
    "--output-format",
    "-o",
    type=click.Choice(["json", "yaml", "table"]),
    default="table",
    help="Specify output format for the status report.",
)
def check(ctx: click.Context, path: str, output_format: str) -> None:
    """Check dependencies in notebook metadata.

    Check the metadata for reproducibility of the notebook.

    Examples:
        jupyterlab-requirements-cli check [YOUR_NOTEBOOK].ipynb

        jupyterlab-requirements-cli check [YOUR_NOTEBOOK].ipynb --output-format yaml
    """
    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = notebook.get("metadata")

    result = check_metadata_content(notebook_metadata=notebook_metadata)

    if output_format == "yaml":
        yaml.safe_dump(result, sys.stdout)

    elif output_format == "json":
        json.dump(result, sys.stdout, indent=2)
        sys.stdout.write("\n")

    elif output_format == "table":
        table = Table()

        header = set()
        for item in result:
            for key in item.keys():
                header.add(key)

        header_sorted = sorted(header)
        for element in header_sorted:
            table.add_column(
                element.replace("_", " ").capitalize(),
                style="cyan",
                overflow="fold",
            )

        for item in result:
            row = []
            for key in header_sorted:
                entry = item.get(key)
                if not bool(int(os.getenv("JUPYTERLAB_REQUIREMENTS_NO_EMOJI", 0))) and isinstance(entry, str):
                    entry = _EMOJI.get(entry, entry)

                row.append(entry if entry is not None else "-")

            table.add_row(*row)

        console = Console()
        console.print(table, justify="center")

    sys.exit(1 if any(item.get("type") == "ERROR" for item in result) else 0)


@cli.command("kernel-create")
@click.pass_context
@click.argument("path")
@click.option(
    "--force",
    is_flag=True,
    help="Force actions for creation of kernel.",
)
@click.option(
    "--kernel-name",
    is_flag=False,
    type=str,
    default="jupyterlab-requirements",
    show_default=True,
    help="Name of kernel.",
)
def kernel_install(ctx: click.Context, path: str, force: bool, kernel_name: str) -> None:
    """Create kernel using dependencies in notebook metadata.

    Create kernel for your notebook.

    Examples:
        jupyterlab-requirements-cli kernel-create [YOUR_NOTEBOOK].ipynb
    """
    if force:
        click.echo("--force is enabled")

    # 0. Check if all metadata for dependencies are present in the notebook
    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = notebook.get("metadata")
    result = check_metadata_content(notebook_metadata=notebook_metadata)

    if any(item.get("type") == "ERROR" for item in result):
        click.echo(
            "Kernel with dependencies cannot be created.\n"
            f"Please run `jupyterlab-requirements-cli check {path}` for more information."
        )
        sys.exit(1)

    language_info = notebook_metadata.get("language_info")
    language = language_info.get("name")
    if language != "python":
        raise Exception("Only Python kernels are currently supported.")

    kernelspec = notebook_metadata.get("kernelspec")
    kernel = kernelspec.get("name")
    click.echo(f"Kernel name is: {kernel!s}")

    home = Path.home()
    store_path: Path = home.joinpath(".local/share/thoth/kernels")

    if kernel == "python3":
        click.echo("python3 kernel name, cannot be overwritten, assigning default jupyterlab-requirements")
        kernel = kernel_name

    dependency_resolution_engine = notebook_metadata.get("dependency_resolution_engine")

    if not dependency_resolution_engine:
        raise KeyError("No Resolution engine identified in notebook metadata.")

    click.echo(f"Resolution engine identified: {dependency_resolution_engine!s}")

    complete_path = store_path.joinpath(kernel)

    if complete_path.exists():
        if not force:
            raise FileExistsError(
                f"kernel repo already exists at path: {complete_path.as_posix()!r}. Use --force to overwrite it."
            )

        else:
            delete_kernel(kernel_name=kernel_name)

    complete_path.mkdir(parents=True, exist_ok=True)

    # 1. Get Pipfile, Pipfile.lock and .thoth.yaml and store them in ./.local/share/kernel/{kernel_name}

    # requirements
    pipfile_string = notebook_metadata.get("requirements")
    pipfile_ = Pipfile.from_string(pipfile_string)
    pipfile_path = complete_path.joinpath("Pipfile")
    pipfile_.to_file(path=pipfile_path)

    # requirements lock
    pipfile_lock_string = notebook_metadata.get("requirements_lock")
    pipfile_lock_ = PipfileLock.from_string(pipfile_content=pipfile_lock_string, pipfile=Pipfile.from_string(""))
    pipfile_lock_path = complete_path.joinpath("Pipfile.lock")
    pipfile_lock_.to_file(path=pipfile_lock_path)

    if dependency_resolution_engine == "thoth":
        thoth_config_string = notebook_metadata.get("thoth_config")
        config = _Configuration()
        config.load_config_from_string(thoth_config_string)
        config_path = complete_path.joinpath(".thoth.yaml")
        config.save_config(path=config_path)

    # 2. Create virtualenv and install dependencies
    install_packages(kernel_name=kernel, resolution_engine=dependency_resolution_engine)
    click.echo(f"Requirements installed using micropipenv in virtualenv at {complete_path}.")

    # 3. Install packages using micropipenv
    create_kernel(kernel_name=kernel)
    click.echo(f"Installed kernelspec called {kernel}.")
    ctx.exit(0)


__name__ == "__main__" and cli()
