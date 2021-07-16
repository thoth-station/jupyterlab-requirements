#!/usr/bin/env python3
# horus
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

"""A CLI for jupyterlab-requirements: Horus."""

import logging
import os
import json
import ast
import sys
import subprocess
import yaml
import click
import typing
import invectio
import distutils.sysconfig as sysconfig

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

from jupyterlab_requirements import __version__

from dependency_management import create_kernel
from dependency_management import delete_kernel
from dependency_management import get_packages
from dependency_management import get_thoth_config
from dependency_management import install_packages
from dependency_management import load_files
from dependency_management import lock_dependencies_with_pipenv
from dependency_management import lock_dependencies_with_thoth


_LOGGER = logging.getLogger("thoth.jupyterlab_requirements.cli")


_EMOJI = {
    "WARNING": Text("\u26a0\ufe0f WARNING", style="yellow"),
    "ERROR": Text("\u274c ERROR", style="bold red"),
    "INFO": Text("\u2714\ufe0f INFO", "green"),
}


def _print_version(ctx: click.Context, _, value: str):
    """Print version and exit."""
    if not value or ctx.resilient_parsing:
        return

    click.echo(__version__)
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
def cli(
    ctx=None,
    verbose: bool = False,
    output: Optional[str] = None,
):
    """Horus: CLI for jupyterlab-requirements."""
    if verbose:
        _LOGGER.setLevel(logging.DEBUG)

    _LOGGER.debug("Debug mode is on")
    _LOGGER.info("Version: %s", __version__)


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


@cli.command("version")
@click.pass_context
@click.option("--json", "-j", "json_output", is_flag=True, help="Print output in JSON format.")
def version(ctx, json_output: bool = False):
    """Print Horus, Thamos and Thoth version and exit."""
    click.echo(f"Horus (jupyterlab-requirements CLI) version: {__version__}")

    process_output = subprocess.run("thamos version", shell=True, capture_output=True)
    click.echo(process_output.stdout.decode("utf-8"))

    ctx.exit(0)


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
    force: bool = False,
):
    """Extract dependencies from notebook metadata.

    Examples:
        horus extract [YOUR_NOTEBOOK].ipynb
        horus extract [YOUR_NOTEBOOK].ipynb  --pipfile
        horus extract [YOUR_NOTEBOOK].ipynb  --pipfile-lock
        horus extract [YOUR_NOTEBOOK].ipynb  --thoth-config
    """
    extract_all = False

    if not pipfile and not pipfile_lock and not thoth_config:
        # If no parameter to be extracted is set, extract all is set.
        extract_all = True

    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = notebook.get("metadata")

    language_info = notebook_metadata.get("language_info")
    language = language_info.get("name")

    if language != "python":
        raise Exception("Only Python kernels are currently supported.")

    kernelspec = notebook_metadata.get("kernelspec")
    kernel_name = kernelspec.get("name")
    click.echo(f"Kernel name is: {kernel_name!s}")

    store_path: Path = Path(store_files_path)

    if use_overlay:
        if not kernel_name:
            raise KeyError("No kernel name identified in notebook metadata kernelspec.")

        store_path = store_path.joinpath("overlays").joinpath(kernel_name)
        store_path.mkdir(parents=True, exist_ok=True)

    dependency_resolution_engine = notebook_metadata.get("dependency_resolution_engine")

    if not dependency_resolution_engine:
        raise KeyError("No Resolution engine identified in notebook metadata.")

    click.echo(f"Resolution engine identified: {dependency_resolution_engine!s}")

    if pipfile or pipfile_lock or extract_all:
        pipfile_string = notebook_metadata.get("requirements")

        if not pipfile_string:
            raise KeyError("No Pipfile identified in notebook metadata.")

        pipfile_ = Pipfile.from_string(pipfile_string)

    if pipfile or extract_all:

        pipfile_path = store_path.joinpath("Pipfile")

        if pipfile_path.exists() and not force:
            raise FileExistsError(
                f"Cannot store Pipfile because it already exists at path: {pipfile_path.as_posix()!r}. "
                "Use --force to overwrite existing content or --show-only to visualize it."
            )
        else:
            pipfile_.to_file(path=pipfile_path)

        if not extract_all:
            ctx.exit(0)

    if pipfile_lock or extract_all:
        pipfile_lock_string = notebook_metadata.get("requirements_lock")

        if not pipfile_lock_string:
            raise KeyError("No Pipfile.lock identified in notebook metadata.")

        pipfile_lock_ = PipfileLock.from_string(pipfile_content=pipfile_lock_string, pipfile=pipfile_)

        pipfile_lock_path = store_path.joinpath("Pipfile.lock")

        if pipfile_lock_path.exists() and not force:
            raise FileExistsError(
                f"Cannot store Pipfile.lock because it already exists at path: {pipfile_lock_path.as_posix()!r}. "
                "Use --force to overwrite existing content or --show-only to visualize it."
            )
        else:
            pipfile_lock_.to_file(path=pipfile_lock_path)

        if not extract_all:
            ctx.exit(0)

    if thoth_config or extract_all:
        thoth_config_string = notebook_metadata.get("thoth_config")

        if not thoth_config_string:
            raise KeyError("No .thoth.yaml identified in notebook metadata.")

        config = _Configuration()
        config.load_config_from_string(thoth_config_string)

        yaml_path = Path(".thoth.yaml")
        if yaml_path.exists() and not force:
            raise FileExistsError(
                f"Cannot store .thoth.yaml because it already exists at path: {yaml_path.as_posix()!r}. "
                "Use --force to overwrite existing content or --show-only to visualize it."
            )
        else:
            config.save_config()

        if not extract_all:
            ctx.exit(0)

    ctx.exit(0)


@cli.command("show")
@click.pass_context
@click.argument("path")
@click.option(
    "--pipfile",
    is_flag=True,
    help="Show Pipfile.",
)
@click.option(
    "--pipfile-lock",
    is_flag=True,
    help="Show Pipfile.lock.",
)
@click.option(
    "--thoth-config",
    is_flag=True,
    help="Show .thoth.yaml.",
)
def show(
    ctx: click.Context,
    path: str,
    pipfile: bool = False,
    pipfile_lock: bool = False,
    thoth_config: bool = False,
):
    """Show dependencies from notebook metadata.

    Examples:
        horus show [YOUR_NOTEBOOK].ipynb
        horus show [YOUR_NOTEBOOK].ipynb  --pipfile
        horus show [YOUR_NOTEBOOK].ipynb  --pipfile-lock
        horus show [YOUR_NOTEBOOK].ipynb  --thoth-config
    """
    show_all = False

    if not pipfile and not pipfile_lock and not thoth_config:
        # If no parameter to be shown is set, show all is set.
        show_all = True

    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = notebook.get("metadata")

    language_info = notebook_metadata.get("language_info")
    language = language_info.get("name")

    if language != "python":
        raise Exception("Only Python kernels are currently supported.")

    kernelspec = notebook_metadata.get("kernelspec")
    kernel_name = kernelspec.get("name")
    click.echo(f"Kernel name is: {kernel_name!s}")

    dependency_resolution_engine = notebook_metadata.get("dependency_resolution_engine")

    if not dependency_resolution_engine:
        raise KeyError("No Resolution engine identified in notebook metadata.")

    click.echo(f"Resolution engine identified: {dependency_resolution_engine!s}")

    if pipfile or pipfile_lock or show_all:
        pipfile_string = notebook_metadata.get("requirements")

        if not pipfile_string:
            raise KeyError("No Pipfile identified in notebook metadata.")

        pipfile_ = Pipfile.from_string(pipfile_string)

    if pipfile or show_all:
        click.echo(f"\nPipfile:\n\n{pipfile_.to_string()}")

        if not show_all:
            ctx.exit(0)

    if pipfile_lock or show_all:
        pipfile_lock_string = notebook_metadata.get("requirements_lock")

        if not pipfile_lock_string:
            raise KeyError("No Pipfile.lock identified in notebook metadata.")

        pipfile_lock_ = PipfileLock.from_string(pipfile_content=pipfile_lock_string, pipfile=pipfile_)

        click.echo(f"\nPipfile.lock:\n\n{pipfile_lock_.to_string()}")

        if not show_all:
            ctx.exit(0)

    if thoth_config or show_all:
        thoth_config_string = notebook_metadata.get("thoth_config")

        if not thoth_config_string:
            raise KeyError("No .thoth.yaml identified in notebook metadata.")

        config = _Configuration()
        config.load_config_from_string(thoth_config_string)
        click.echo(f"\n.thoth.yaml:\n\n{yaml.dump(config.content)}")

        if not show_all:
            ctx.exit(0)

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
    kernel_name: str,
    pipfile: bool = False,
    pipfile_lock: bool = False,
    thoth_config: bool = False,
    force: bool = False,
):
    """Save dependencies in notebook metadata.

    Examples:
        horus save [YOUR_NOTEBOOK].ipynb
        horus save [YOUR_NOTEBOOK].ipynb  --pipfile
        horus save [YOUR_NOTEBOOK].ipynb  --pipfile-lock
        horus save [YOUR_NOTEBOOK].ipynb  --thoth-config
    """
    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = dict(notebook.get("metadata"))

    language: str = notebook_metadata["language_info"]["name"]

    if language != "python":
        raise Exception("Only Python kernels are currently supported.")

    click.echo(f"Resolution engine set to {resolution_engine!r}.")

    save_all = False

    if not pipfile and not pipfile_lock and not thoth_config:
        # If no parameter to be saved is set, save all
        save_all = True

    if pipfile or pipfile_lock or save_all:
        pipfile_string, pipfile_lock_string = load_files(base_path=save_files_path)

        pipfile_ = Pipfile.from_string(pipfile_string)
        pipfile_lock_ = PipfileLock.from_string(pipfile_content=pipfile_lock_string, pipfile=pipfile_)

    if pipfile or save_all:
        if "requirements" in notebook_metadata and not force:
            raise FileExistsError(
                "Cannot store Pipfile in notebook metadata because it already exists. "
                "Use --force to overwrite existing content or --show-only to visualize it."
            )
        else:
            if not force:
                click.echo("No requirements found in notebook metadata.")
            else:
                click.echo("Updating existing requirements in notebook metadata.")

            notebook_metadata["requirements"] = json.dumps(pipfile_.to_dict())

    if pipfile_lock or save_all:
        if "requirements_lock" in notebook_metadata and not force:
            raise FileExistsError(
                "Cannot store Pipfile.lock in notebook metadata because it already exists. "
                "Use --force to overwrite existing content or --show-only to visualize it."
            )
        else:
            if not force:
                click.echo("No requirements_lock found in notebook metadata.")
            else:
                click.echo("Updating existing requirements_lock in notebook metadata.")

            notebook_metadata["requirements_lock"] = json.dumps(pipfile_lock_.to_dict())

    if resolution_engine == "thoth":

        if thoth_config or save_all:
            config = _Configuration()
            config.load_config_from_file(config_path=Path(save_files_path).joinpath(".thoth.yaml"))

            if "thoth_config" in notebook_metadata and not force:
                raise FileExistsError(
                    "Cannot store .thoth.yaml in notebook metadata because it already exists. "
                    "Use --force to overwrite existing content or --show-only to visualize it."
                )
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


def get_notebook_content_py(notebook_path: str):
    """Get notebook content in .py format."""
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

    notebook_content_py = check_convert.stdout.decode("utf-8")

    return notebook_content_py


def _gather_libraries(notebook_path: str):
    """Gather libraries with invectio."""
    notebook_content_py = get_notebook_content_py(notebook_path=notebook_path)

    try:
        tree = ast.parse(notebook_content_py)
    except Exception:
        raise

    visitor = invectio.lib.InvectioLibraryUsageVisitor()
    visitor.visit(tree)

    report = visitor.get_module_report()

    std_lib_path = Path(sysconfig.get_python_lib(standard_lib=True))
    std_lib = {p.name.rstrip(".py") for p in std_lib_path.iterdir()}

    libs = filter(lambda k: k not in std_lib | set(sys.builtin_module_names), report)
    library_gathered = list(libs)

    return library_gathered


def create_pipfile_from_packages(packages: list, python_version: str):
    """Create Pipfile from list of packages."""
    source = Source(url="https://pypi.org/simple", name="pypi", verify_ssl=True)

    pipfile_meta = PipfileMeta(sources={"pypi": source}, requires={"python_version": python_version})

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
        horus discover [YOUR_NOTEBOOK].ipynb

        horus discover [YOUR_NOTEBOOK].ipynb --only-show

        horus discover [YOUR_NOTEBOOK].ipynb --force
    """
    packages = _gather_libraries(notebook_path=path)

    if packages:
        click.echo(f"Thoth invectio libraries gathered: {json.dumps(packages)}")
    else:
        click.echo(f"No libraries discovered from notebook at path: {path}")

    python_version = discover_python_version()
    click.echo(f"Python version discovered from host: {python_version}")
    pipfile = create_pipfile_from_packages(packages=packages, python_version=python_version)

    if show_only:
        click.echo(f"\nPipfile:\n\n{pipfile.to_string()}")
        ctx.exit(0)
    else:
        store_path: Path = Path(store_files_path)

        pipfile_path = store_path.joinpath("Pipfile")

        if pipfile_path.exists() and not force:
            raise FileExistsError(
                f"Cannot store Pipfile because it already exists at path: {pipfile_path.as_posix()!r}. "
                "Use --force to overwrite existing content or --show-only to visualize the Pipfile."
            )
        else:
            pipfile.to_file(path=pipfile_path)

    ctx.exit(0)


def check_metadata_content(notebook_metadata: dict) -> list:
    """Check the metadata of notebook for dependencies."""
    result = []

    language = notebook_metadata["language_info"]["name"]

    if language != "python":
        result.append(
            {
                "message": "Only python programming language is supported.",
                "type": "ERROR",
            }
        )

        return result

    kernel_name = notebook_metadata["kernelspec"]["name"]

    result.append(
        {
            "message": f"kernel name: {kernel_name}",
            "type": "INFO",
        }
    )

    if "dependency_resolution_engine" not in notebook_metadata.keys():
        result.append(
            {
                "message": "dependency_resolution_engine key is not present in notebook metadata",
                "type": "ERROR",
            }
        )
    else:
        result.append(
            {
                "message": f"dependency resolution engine: {notebook_metadata['dependency_resolution_engine']}",
                "type": "INFO",
            }
        )

    resolution_engine = notebook_metadata.get("dependency_resolution_engine")

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

    for mandatory_key in ["requirements", "requirements_lock"]:
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
                    "adjusted? Then you should run horus lock PATH to notebook.",
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

        kernel_packages = get_packages(kernel_name=kernel_name)
        notebook_packages = project.pipfile_lock.packages

        check = 0
        for package in notebook_packages:
            if str(package.name) in kernel_packages:
                if str(package.version) in kernel_packages[str(package.name)]:
                    check += 1
            else:
                break

        if check == len([p for p in notebook_packages]):
            result.append(
                {
                    "message": f"kernel {kernel_name} selected has all dependencies installed.",
                    "type": "INFO",
                }
            )
        else:
            result.append(
                {
                    "message": f"kernel {kernel_name} selected does not match your dependencies. "
                    "Please run command horus lock [NOTEBOOK].ipynb",
                    "type": "WARNING",
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
        horus check [YOUR_NOTEBOOK].ipynb

        horus check [YOUR_NOTEBOOK].ipynb --output-format yaml
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


@cli.command("set-kernel")
@click.pass_context
@click.argument("path")
@click.option(
    "--kernel-name",
    is_flag=False,
    type=str,
    help="Name of kernel.",
)
def kernel_install(ctx: click.Context, path: str, kernel_name: Optional[str]) -> None:
    """Create kernel using dependencies in notebook metadata.

    Create kernel for your notebook.

    Examples:
        horus kernel-create [YOUR_NOTEBOOK].ipynb
    """
    # 0. Check if all metadata for dependencies are present in the notebook
    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = notebook.get("metadata")
    result = check_metadata_content(notebook_metadata=notebook_metadata)

    if any(item.get("type") == "ERROR" for item in result):
        click.echo(
            "Kernel with dependencies cannot be created.\n" f"Please run `horus check {path}` for more information."
        )
        sys.exit(1)

    language_info = notebook_metadata.get("language_info")
    language = language_info.get("name")
    if language != "python":
        raise Exception("Only Python kernels are currently supported.")

    kernelspec = notebook_metadata.get("kernelspec")
    notebook_kernel = kernelspec.get("name")

    if not kernel_name:
        kernel = notebook_kernel
    else:
        kernel = kernel_name

    if kernel == "python3":
        click.echo("python3 kernel name, cannot be overwritten, assigning default jupyterlab-requirements")
        kernel = "jupyterlab-requirements"

    click.echo(f"Kernel name is: {kernel!s}")

    home = Path.home()
    store_path: Path = home.joinpath(".local/share/thoth/kernels")

    dependency_resolution_engine = notebook_metadata.get("dependency_resolution_engine")

    if not dependency_resolution_engine:
        raise KeyError("No Resolution engine identified in notebook metadata.")

    click.echo(f"Resolution engine identified: {dependency_resolution_engine!s}")

    complete_path: Path = store_path.joinpath(kernel)

    if complete_path.exists():
        delete_kernel(kernel_name=kernel)

    complete_path.mkdir(parents=True, exist_ok=True)

    # 1. Get Pipfile, Pipfile.lock and .thoth.yaml and store them in ./.local/share/kernel/{kernel_name}

    # requirements
    pipfile_string = notebook_metadata.get("requirements")
    pipfile_ = Pipfile.from_string(pipfile_string)
    pipfile_path = complete_path.joinpath("Pipfile")
    pipfile_.to_file(path=pipfile_path)

    # requirements lock
    pipfile_lock_string = notebook_metadata.get("requirements_lock")
    pipfile_lock_ = PipfileLock.from_string(pipfile_content=pipfile_lock_string, pipfile=pipfile_)
    pipfile_lock_path = complete_path.joinpath("Pipfile.lock")
    pipfile_lock_.to_file(path=pipfile_lock_path)

    if dependency_resolution_engine == "thoth":
        # thoth
        thoth_config_string = notebook_metadata.get("thoth_config")
        config = _Configuration()
        config.load_config_from_string(thoth_config_string)
        config_path = complete_path.joinpath(".thoth.yaml")
        config.save_config(path=config_path)

    # 2. Create virtualenv and install dependencies
    click.echo("Installing requirements with micropipenv...")
    install_packages(kernel_name=kernel, resolution_engine=dependency_resolution_engine, is_cli=True)
    click.echo(f"Requirements installed using micropipenv in virtualenv at {complete_path}.")

    # 3. Install packages using micropipenv
    click.echo("Installing kernel for Jupyter notebooks...")
    create_kernel(kernel_name=kernel)
    click.echo(f"Installed kernelspec called {kernel}.")
    ctx.exit(0)


@cli.command("requirements")
@click.pass_context
@click.argument("path")
@click.option(
    "-a",
    "--add",
    is_flag=False,
    multiple=True,
    type=str,
    help="Add package to requirements (if does not exists).",
)
@click.option(
    "-r",
    "--remove",
    is_flag=False,
    multiple=True,
    type=str,
    help="Remove package to requirements (if exists).",
)
@click.option(
    "--index-url",
    "-i",
    default="https://pypi.org/simple",
    type=str,
    metavar="INDEX_URL",
    show_default=True,
    help="Specify Python package index to be used as a source for the given requirement/s.",
)
@click.option(
    "--dev",
    is_flag=True,
    show_default=True,
    help="Add/Remove the given package to the development packages.",
)
def requirements(
    ctx: click.Context,
    path: str,
    index_url: str,
    dev: bool,
    add: Optional[typing.List[str]] = None,
    remove: Optional[typing.List[str]] = None,
) -> None:
    """Add/Remove one or multiple requirements from the notebook.

    -add: add one or multiple requirements to the direct dependency listing without actually installing them.
    The supplied requirement is specified using PEP-508 standard.

    Examples:
      horus requirements [YOUR_NOTEBOOK].ipynb --add flask

      horus requirements [YOUR_NOTEBOOK].ipynb --add tensorflow --runtime-environment "training"

      horus requirements [YOUR_NOTEBOOK].ipynb --add --dev 'pytest~=6.2.0'

      horus requirements [YOUR_NOTEBOOK].ipynb --add 'importlib-metadata; python_version < "3.8"'

      horus requirements [YOUR_NOTEBOOK].ipynb --remove flask
    """
    if not add and not remove:
        click.echo("No action selected. You can check horus requirements --help")

    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = dict(notebook.get("metadata"))

    pipfile_string = notebook_metadata.get("requirements")

    if not pipfile_string:
        python_version = discover_python_version()
        pipfile_ = create_pipfile_from_packages(packages=[], python_version=python_version)
    else:
        pipfile_ = Pipfile.from_string(pipfile_string)

    if add:
        for req in add:
            _LOGGER.info(
                "Adding %r to %s requirements",
                req,
                "development" if dev else "default",
            )
            pipfile_.add_requirement(req, is_dev=dev, index_url=index_url, force=True)

    if remove:
        for req in remove:
            any_change = False

            if req in pipfile_.packages.packages:
                pipfile_.packages.packages.pop(req)
                _LOGGER.info(
                    "Removed %r from default requirements",
                    req,
                )
                any_change = True

            if req in pipfile_.dev_packages.packages:
                pipfile_.dev_packages.packages.pop(req)
                _LOGGER.info(
                    "Removed %r from development requirements",
                    req,
                )
                any_change = True

            if not any_change:
                _LOGGER.error(
                    "Requirement %r not found in requirements, " "aborting making any changes.",
                    req,
                )
                sys.exit(1)

    click.echo(f"\nPipfile:\n\n{pipfile_.to_string()}")
    notebook_metadata["requirements"] = json.dumps(pipfile_.to_dict())

    notebook["metadata"] = notebook_metadata
    save_notebook_content(notebook_path=path, notebook=notebook)
    ctx.exit(0)


@cli.command("lock")
@click.pass_context
@click.argument("path")
@click.option(
    "--kernel-name",
    is_flag=False,
    type=str,
    help="Name of kernel.",
)
@click.option(
    "--pipenv",
    is_flag=True,
    help="Lock dependencies using Pipenv.",
)
@click.option(
    "--timeout",
    is_flag=False,
    type=int,
    default=180,
    show_default=True,
    help="Set timeout for thoth advise request (only for Thoth).",
)
@click.option(
    "--force",
    is_flag=True,
    help="Force thoth advise request (only for Thoth).",
)
def lock(
    ctx: click.Context,
    path: str,
    timeout: int,
    force: bool,
    kernel_name: Optional[str] = None,
    pipenv: bool = False,
) -> None:
    """Lock requirements in notebook metadata.

    Examples:
      horus lock [YOUR_NOTEBOOK].ipynb
    """
    resolution_engine = "thoth"

    if pipenv:
        resolution_engine = "pipenv"

    click.echo(f"Resolution engine used is {resolution_engine}")

    notebook = get_notebook_content(notebook_path=path)
    notebook_metadata = notebook.get("metadata")

    kernelspec = notebook_metadata.get("kernelspec")
    notebook_kernel = kernelspec.get("name")

    if not kernel_name:
        kernel = notebook_kernel
    else:
        kernel = kernel_name

    if kernel == "python3":
        click.echo("python3 kernel name, cannot be overwritten, assigning default jupyterlab-requirements")
        kernel = "jupyterlab-requirements"

    click.echo(f"Kernel name is: {kernel!s}")

    pipfile_string = notebook_metadata.get("requirements")

    if not pipfile_string:
        raise KeyError(
            "No Pipfile identified in notebook metadata."
            "You can start creating one with command: "
            "`horus requirements [NOTEBOOK].ipynb --add [PACKAGE NAME]`"
        )

    pipfile_ = Pipfile.from_string(pipfile_string)

    if resolution_engine == "thoth":

        thoth_config = notebook_metadata.get("thoth_config")

        if not thoth_config:
            thoth_config = get_thoth_config(kernel_name=kernel)

        notebook_content_py = get_notebook_content_py(notebook_path=path)

        returncode, advise = lock_dependencies_with_thoth(
            kernel_name=kernel,
            pipfile_string=pipfile_string,
            config=json.dumps(thoth_config),
            timeout=timeout,
            force=force,
            notebook_content=notebook_content_py,
        )

        if returncode != 0 or advise["error"]:
            click.echo({"error_msg": advise["error_msg"]})

            ctx.exit(returncode)
        else:
            pipfile_ = Pipfile.from_dict(advise["requirements"])
            pipfile_lock_ = PipfileLock.from_dict(advise["requirement_lock"], pipfile_)
            _LOGGER.debug(f"\nPipfile:\n\n{pipfile_.to_string()}")
            _LOGGER.debug(f"\nPipfile.lock:\n\n{pipfile_lock_.to_string()}")
            click.echo("Thoth successfully resolved your stack.")
            notebook_metadata["thoth_config"] = json.dumps(thoth_config)

    if resolution_engine == "pipenv":
        returncode, result = lock_dependencies_with_pipenv(kernel_name=kernel, pipfile_string=pipfile_.to_string())

        if returncode != 0 or result["error"]:
            click.echo({"error_msg": result["error_msg"]})

            ctx.exit(returncode)
        else:
            pipfile_lock_ = PipfileLock.from_dict(result["requirements_lock"], pipfile_)
            _LOGGER.debug(f"\nPipfile:\n\n{pipfile_string}")
            _LOGGER.debug(f"\nPipfile.lock:\n\n{pipfile_lock_.to_string()}")
            click.echo("Pipenv successfully resolved your stack.")

    notebook_metadata["dependency_resolution_engine"] = resolution_engine
    notebook_metadata["requirements"] = json.dumps(pipfile_.to_dict())
    notebook_metadata["requirements_lock"] = json.dumps(pipfile_lock_.to_dict())

    notebook["metadata"] = notebook_metadata
    save_notebook_content(notebook_path=path, notebook=notebook)

    click.echo(
        "All dependencies content is stored in notebook metadata."
        "Run `horus set-kernel [NOTEBOOK].ipynb` to prepare the kernel for your notebook."
    )


__name__ == "__main__" and cli()
