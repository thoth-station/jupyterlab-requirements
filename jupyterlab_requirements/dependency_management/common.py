# jupyterlab-requirements
# Copyright(C) 2020 Francesco Murdaca
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

"""Common methods for jupyterlab requirements."""

import logging
import subprocess
from pathlib import Path


_LOGGER = logging.getLogger("jupyterlab_requirements.common")


def select_complete_path():
    """Select complete path (git or home)."""
    try:
        process_output = subprocess.run(
            'git rev-parse --show-toplevel',
            capture_output=True,
            shell=True
        )
        git_root = process_output.stdout.decode("utf-8").strip()
        complete_path = Path(git_root)
        _LOGGER.info("complete path used is: %r", complete_path.as_posix())

    except Exception as not_git_exc:
        _LOGGER.error("Using home path because there was an error to identify root of git repository: %r", not_git_exc)
        complete_path = Path.home()

    return complete_path
