import React from 'react';
import PropTypes from 'prop-types';
import { isMobile } from 'react-device-detect';

import styles from './styles.module.css';
import Loader from '../Loader';
import TextInput from '../TextInput';

const PopUp = ({ text, buttonOne, buttonTwo, loading, inputValue, inputChange, inputPlaceholder }) => {
  return (
    <div className={styles.modal}>
      <div className={styles.container}>
        <div className={styles.text}>
          {text}
        </div>

        {loading ? (
          <Loader margin="30px auto 25px auto" />
        ) : (
          <div className={styles.bottomHolder}>
            {inputValue !== undefined ? (
              <TextInput
                placeholder={inputPlaceholder}
                onChange={inputChange}
                value={inputValue}
                autoFocus={!isMobile}
                width="80%"
              />
            ) : null}

            <div className={styles.buttonContainer}>
              <div className={styles.button} role="button" tabIndex={0} onClick={buttonOne.onClick}>
                {buttonOne.text}
              </div>

              {buttonTwo ? (
                <div className={styles.button} role="button" tabIndex={0} onClick={buttonTwo.onClick}>
                  {buttonTwo.text}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

PopUp.propTypes = {
  text: PropTypes.string,
  buttonOne: PropTypes.shape({
    text: PropTypes.string,
    onClick: PropTypes.func,
  }),
  buttonTwo: PropTypes.shape({
    text: PropTypes.string,
    onClick: PropTypes.func,
  }),
  loading: PropTypes.bool,
  inputValue: PropTypes.any,
  inputChange: PropTypes.func,
  inputPlaceholder: PropTypes.string,
};

export default PopUp;
