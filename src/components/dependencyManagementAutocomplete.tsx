/**
 * Jupyterlab requirements.
 *
 * Jupyterlab extension for managing dependencies.
 *
 * @link   https://github.com/thoth-station/jupyterlab-requirements#readme
 * @file   Jupyterlab extension for managing dependencies.
 * @author Gage Krumbach <gkrumbac@redhat.com>
 * @since  0.15.0
 */
import * as React from 'react';

import debounce from "lodash/debounce";
import axios from "axios";
import { infoIcon } from "../icons";

/**
 * (CSS).
 */
const THOTH_PACKAGE_DROPDOWN = "thoth-package-dropdown";
const THOTH_PACKAGE_DROPDOWN_OPTION = "thoth-package-dropdown-option";
const THOTH_PACKAGE_DROPDOWN_NAME = "thoth-package-dropdown-name";
const THOTH_PACKAGE_DROPDOWN_DESC = "thoth-package-dropdown-desc";

/**
 * Class: Holds properties for DependencyManagementAutocomplete.
 */
export interface IProps {
  input: string;
  inputFocus: boolean;
}
export interface IState {
  data: {
    name: string;
    info: { summary: string }
  };
}

/**
 * A React Component for data autocomplete dropdown menu.
 */
export const DependencyManagementAutocomplete: React.FC<IProps> = ({input, inputFocus}) => {
  const [data, setData] = React.useState(null)

  const debounced = React.useRef(debounce(name => {
    if (name === "") {
      setData(null)
      return;
    }

    const url = `https://pypi.org/pypi/${name}/json`;
    axios
      .get(url)
      .then(({ data }) => {
        setData(data)
      })
      .catch(() => {
        setData(null)
      })
  }, 500));

  React.useEffect(() => debounced.current(input), [input])

  const description = React.useMemo( () =>  {
    if(data) {
      return (
        <>
          <div className={THOTH_PACKAGE_DROPDOWN_OPTION}>
            <p className={`${THOTH_PACKAGE_DROPDOWN_NAME} ${THOTH_PACKAGE_DROPDOWN_OPTION}`}> { data.info.name }</p>
            <p className={`${THOTH_PACKAGE_DROPDOWN_DESC} ${THOTH_PACKAGE_DROPDOWN_OPTION}`}>{ data.info.summary }</p>
          </div>
        </>
      )
    }
    else {
      return(
        <>
          <i>no results</i>
        </>
      )
    }

  }, [data])


  return(
    <>
      <br/>
      {inputFocus && description && input !== ""
        ? <div className={THOTH_PACKAGE_DROPDOWN}
        >
          <infoIcon.react
            tag="div"
            elementPosition="center"
            width="20px"
            height="20px"
            marginRight=".5rem"
          />
          { description }
      </div>
        : undefined}
    </>
  )
}
