import React from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.css';

const TextInput = ({ placeholder, onChange, autoFocus, value, width, type, customStyle, id }) => {
  // fontSize defaults to 20px if not included
  return (
    <input
      className={styles.input}
      style={{
        width: `calc(${width} - 20px)`,
        ...customStyle,
      }}
      id={id}
      placeholder={placeholder}
      onChange={onChange}
      type={type || 'text'}
      autoFocus={autoFocus ? 'autofocus' : ''}
      value={value}
    />
  );
};

TextInput.propTypes = {
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool,
  value: PropTypes.any,
  width: PropTypes.string,
  type: PropTypes.string,
  customStyle: PropTypes.object,
  id: PropTypes.string,
};

export default TextInput;
