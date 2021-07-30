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
import sys
import subprocess
import yaml
import click
import typing

from typing import Optional
from pathlib import Path
from rich.console import Console
from rich.table import Table

from thoth.python import Pipfile, PipfileLock
from thamos.config import _Configuration
from thamos.discover import discover_python_version

from jupyterlab_requirements import __version__

from jupyterlab_requirements.dependency_management import _EMOJI
from jupyterlab_requirements.dependency_management import check_metadata_content
from jupyterlab_requirements.dependency_management import create_pipfile_from_packages
from jupyterlab_requirements.dependency_management import gather_libraries
from jupyterlab_requirements.dependency_management import get_notebook_content
from jupyterlab_requirements.dependency_management import horus_extract_command
from jupyterlab_requirements.dependency_management import horus_lock_command
from jupyterlab_requirements.dependency_management import horus_requirements_command
from jupyterlab_requirements.dependency_management import horus_set_kernel_command
from jupyterlab_requirements.dependency_management import horus_show_command
from jupyterlab_requirements.dependency_management import load_files
from jupyterlab_requirements.dependency_management import save_notebook_content


_LOGGER = logging.getLogger("thoth.jupyterlab_requirements.cli")


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
    results = horus_extract_command(
        notebook_path=path,
        store_files_path=store_files_path,
        pipfile=pipfile,
        pipfile_lock=pipfile_lock,
        thoth_config=thoth_config,
        use_overlay=use_overlay,
        force=force,
    )

    click.echo(f"Kernel name is: {results['kernel_name']!s}")

    if not results["resolution_engine"]:
        click.echo("No Resolution engine identified in notebook metadata.")
    else:
        click.echo(f"Resolution engine identified: {results['resolution_engine']!s}")

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
    results = horus_show_command(
        path=path,
        pipfile=pipfile,
        pipfile_lock=pipfile_lock,
        thoth_config=thoth_config,
    )
    click.echo(f"Kernel name is: {results['kernel_name']!s}")

    if not results["dependency_resolution_engine"]:
        click.echo("No Resolution engine identified in notebook metadata.")
    else:
        click.echo(f"Resolution engine identified: {results['dependency_resolution_engine']!s}")

    if results["pipfile"]:
        click.echo(results["pipfile"])

    if results["pipfile_lock"]:
        click.echo(results["pipfile_lock"])

    if results["thoth_config"]:
        click.echo(results["thoth_config"])

    ctx.exit(0)


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

    language = notebook_metadata["language_info"]["name"]

    if language and language != "python":
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
    packages = gather_libraries(notebook_path=path)

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
def set_kernel(ctx: click.Context, path: str, kernel_name: Optional[str]) -> None:
    """Create kernel using dependencies in notebook metadata.

    Create kernel for your notebook.

    Examples:
        horus set-kernel [YOUR_NOTEBOOK].ipynb
    """
    results = horus_set_kernel_command(path=path, kernel_name=kernel_name)

    if results["kernel_name"] == "python3":
        click.echo("python3 kernel name, cannot be overwritten, assigning default jupyterlab-requirements")

    click.echo(f"Kernel name is: {results['kernel_name']!s}")

    click.echo(f"Resolution engine identified: {results['dependency_resolution_engine']!s}")

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
        click.echo("No action selected. You can run `horus requirements --help`")

    pipfile_ = horus_requirements_command(
        path=path,
        index_url=index_url,
        dev=dev,
        add=add,
        remove=remove,
    )

    click.echo(f"\nPipfile:\n\n{pipfile_.to_string()}")

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
    help="Set timeout for Thoth advise request.",
)
@click.option(
    "--force",
    is_flag=True,
    help="Force Thoth advise request.",
)
@click.option(
    "--recommendation-type",
    is_flag=False,
    type=click.Choice(["latest", "stable", "performance", "security"], case_sensitive=False),
    default="latest",
    show_default=True,
    required=True,
    help="Reccomendation type for Thoth advise request.",
)
@click.option(
    "--os-name",
    is_flag=False,
    type=str,
    required=False,
    help="OS name for Thoth advise request.",
)
@click.option(
    "--os-version",
    is_flag=False,
    type=str,
    required=False,
    help="OS version for Thoth advise request.",
)
@click.option(
    "--python-version",
    is_flag=False,
    type=str,
    required=False,
    help="Python version for Thoth advise request.",
)
def lock(
    ctx: click.Context,
    path: str,
    timeout: int,
    force: bool,
    recommendation_type: str,
    kernel_name: Optional[str] = None,
    pipenv: bool = False,
    os_name: Optional[str] = None,
    os_version: Optional[str] = None,
    python_version: Optional[str] = None,
) -> None:
    """Lock requirements in notebook metadata.

    Examples:
      horus lock [YOUR_NOTEBOOK].ipynb
    """
    resolution_engine = "thoth"

    if pipenv:
        resolution_engine = "pipenv"

    click.echo(f"Resolution engine used: {resolution_engine}")

    results, lock_results = horus_lock_command(
        path=path,
        resolution_engine=resolution_engine,
        timeout=timeout,
        force=force,
        recommendation_type=recommendation_type,
        kernel_name=kernel_name,
        os_name=os_name,
        os_version=os_version,
        python_version=python_version,
    )

    if results["kernel_name"] == "python3":
        click.echo("python3 kernel name, cannot be overwritten, assigning default jupyterlab-requirements")

    click.echo(f"Kernel name is: {results['kernel_name']!s}")
    click.echo(f"runtime environment used: {results['runtime_environment']}")

    if lock_results["error"]:
        click.echo({"error_msg": lock_results["error_msg"]})
        ctx.exit(1)
    else:
        if resolution_engine == "thoth":
            click.echo("Thoth successfully resolved your stack.")
        else:
            click.echo("Pipenv successfully resolved your stack.")

        click.echo(
            "All dependencies content is stored in notebook metadata. "
            "Run `horus set-kernel [NOTEBOOK].ipynb` to prepare the kernel for your notebook."
        )


__name__ == "__main__" and cli()
