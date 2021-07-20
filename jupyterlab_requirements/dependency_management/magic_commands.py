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

"""jupyterlab-requirements magic commands."""

# from IPython.core.magic import line_magic  # Called with %
# from IPython.core.magic import line_cell_magic  # Called with % or %%
from IPython.core.magic import cell_magic  # Called with %%
from IPython.core.magic import magics_class, Magics


@magics_class
class HorusMagics(Magics):
    """Horus jupyterlab-requirements CLI as magic commands."""

    @cell_magic
    def horus(self, line, cell):
        """Show test."""
        print("This is Horus: jupyterlab-requirements CLI")
        return line, cell
